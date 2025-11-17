import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import pdf from 'npm:pdf-parse@1.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ParsedAssignment {
  title: string;
  dueDate: string | null;
  weight: number | null;
  type: string;
}

interface ParsedExam {
  title: string;
  date: string | null;
  weight: number | null;
}

interface ParsedSyllabus {
  courseName: string;
  instructor: string;
  emails?: string[];
  officeHours?: string;
  officeLocation?: string;
  coordinator?: string;
  semester: string;
  assignments: ParsedAssignment[];
  exams: ParsedExam[];
  gradeWeights: Record<string, number>;
  gradeScheme?: Array<{ component: string; weight: number; notes?: string }>;
  meetingTimes: string;
  location: string;
  importantDates: Array<{ event: string; date: string }>;
}

// ----------------------------
// Helpers for structured parsing
// ----------------------------

function sliceToRelevantSection(text: string): string {
  const lower = text.toLowerCase();
  const startIdx = lower.indexOf('instructors and office hours');
  const endIdx = lower.indexOf('academic integrity');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.slice(startIdx, endIdx);
  }
  const schedIdx = lower.indexOf('tentative schedule');
  if (startIdx !== -1 && schedIdx !== -1 && schedIdx > startIdx) {
    return text.slice(startIdx, schedIdx);
  }
  return text;
}

function extractCourseInfo(text: string): {
  courseName: string | null;
  semester: string | null;
  instructor: string | null;
  emails: string[];
  officeHours: string | null;
  officeLocation: string | null;
  coordinator: string | null;
} {
  const courseMatch = text.match(/\b([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\s*[–-]\s*([^\n]+)/);
  const semesterMatch = text.match(/\b(Fall|Spring|Summer)\s+(\d{4})\b/i);
  const instructorMatch = text.match(/instructor[s]?:\s*([^\n]+)/i);
  const coordinatorMatch = text.match(/coordinator[: ]\s*([^\n]+)/i);
  const officeHoursMatch = text.match(/office hours?:\s*([^\n]+)/i);
  const officeLocMatch = text.match(/office\s*(location|room|address)?[: ]\s*([^\n]+)/i);
  const emails = [...text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m => m[0]);

  return {
    courseName: courseMatch ? courseMatch[0].trim() : null,
    semester: semesterMatch ? semesterMatch[0] : null,
    instructor: instructorMatch ? instructorMatch[1].trim() : null,
    emails,
    officeHours: officeHoursMatch ? officeHoursMatch[1].trim() : null,
    officeLocation: officeLocMatch ? (officeLocMatch[2] || officeLocMatch[0]).trim() : null,
    coordinator: coordinatorMatch ? coordinatorMatch[1].trim() : null,
  };
}

function normalizeWeightScheme(entries: Array<{ component: string; weight: number; notes?: string }>): Array<{ component: string; weight: number; notes?: string }> {
  const total = entries.reduce((sum, e) => sum + (e.weight || 0), 0);
  if (total > 0 && Math.abs(total - 100) > 15) {
    // scale to 100
    return entries.map(e => ({ ...e, weight: Math.round((e.weight / total) * 1000) / 10 }));
  }
  if (total === 0) {
    return entries;
  }
  // if within 85-115, scale gently
  return entries.map(e => ({ ...e, weight: Math.round((e.weight / total) * 1000) / 10 }));
}

function extractGradeScheme(text: string): Array<{ component: string; weight: number; notes?: string }> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const scheme: Array<{ component: string; weight: number; notes?: string }> = [];

  for (const line of lines) {
    if (!line.match(/\d{1,3}%/)) continue;
    const match = line.match(/(?<comp>[A-Za-z0-9\s./()&-]+?)\s*[:\-]?\s*(?<pct>\d{1,3})%/);
    if (match?.groups?.comp && match.groups.pct) {
      scheme.push({
        component: match.groups.comp.trim(),
        weight: parseFloat(match.groups.pct),
      });
    }
  }

  return normalizeWeightScheme(scheme);
}

function formatDate(text: string, fallbackYear?: string): string | null {
  const cleaned = text.trim();
  const year = fallbackYear || '2025';

  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return cleaned;

  const slash = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (slash) {
    const [, m, d, y] = slash;
    const fullYear = y ? (y.length === 2 ? `20${y}` : y) : year;
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const textDate = cleaned.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?/i);
  if (textDate) {
    const [, mon, day, y] = textDate;
    const monthNames: Record<string, string> = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', sept:'09', oct:'10', nov:'11', dec:'12' };
    const fullYear = y || year;
    return `${fullYear}-${monthNames[mon.toLowerCase().substring(0,3)]}-${day.padStart(2,'0')}`;
  }
  return null;
}

function extractDatedEvents(text: string, fallbackYear?: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const events: ParsedExam[] = [];
  const assignments: ParsedAssignment[] = [];

  for (const line of lines) {
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)|((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s+\d{4})?)/i);
    if (!dateMatch) continue;
    const dateStr = dateMatch[0];
    const normalized = formatDate(dateStr, fallbackYear);
    if (!normalized) continue;
    const lower = line.toLowerCase();
    const weightMatch = line.match(/(\d{1,3})%/);
    const weight = weightMatch ? parseFloat(weightMatch[1]) / 100 : null;

    if (lower.includes('final')) {
      events.push({ title: line, date: normalized, weight, type: 'final' as any });
    } else if (lower.includes('midterm') || lower.includes('exam') || lower.includes('test')) {
      events.push({ title: line, date: normalized, weight, type: 'midterm' as any });
    } else if (lower.includes('quiz')) {
      assignments.push({ title: line, dueDate: normalized, weight, type: 'quiz' });
    } else if (lower.includes('homework') || lower.includes('assignment') || lower.includes('project') || lower.includes('lab') || lower.includes('hw')) {
      assignments.push({ title: line, dueDate: normalized, weight, type: 'assignment' });
    } else if (lower.includes('holiday') || lower.includes('break') || lower.includes('reading day')) {
      // treat as important date; handled later via importantDates
    }
  }

  return { events, assignments };
}

async function computeSHA256(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeDate(dateStr: string, semesterYear?: string): string | null {
  const cleaned = dateStr.trim();
  const year = semesterYear || '2025';

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (slashMatch) {
    const [, month, day, yr] = slashMatch;
    const fullYear = yr ? (yr.length === 2 ? `20${yr}` : yr) : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const textMatch = cleaned.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?$/i);
  if (textMatch) {
    const [, month, day, yr] = textMatch;
    const monthNum = monthNames[month.toLowerCase().substring(0, 3)];
    const fullYear = yr || year;
    return `${fullYear}-${monthNum}-${day.padStart(2, '0')}`;
  }

  return null;
}

function regexExtractor(text: string): Partial<ParsedSyllabus> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const assignments: ParsedAssignment[] = [];
  const exams: ParsedExam[] = [];
  const importantDates: Array<{ event: string; date: string }> = [];

  const semesterMatch = text.match(/fall\s+(\d{4})|spring\s+(\d{4})|summer\s+(\d{4})/i);
  const year = semesterMatch ? (semesterMatch[1] || semesterMatch[2] || semesterMatch[3]) : '2025';

  const datePattern = /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b|\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s+\d{4})?)\b/gi;
  const weightPattern = /(\d+(?:\.\d+)?)%/;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    const dateMatches = [...line.matchAll(datePattern)];
    const weightMatch = line.match(weightPattern);

    for (const dateMatch of dateMatches) {
      const dateStr = dateMatch[1] || dateMatch[2];
      const normalizedDate = normalizeDate(dateStr, year);
      if (!normalizedDate) continue;

      const weight = weightMatch ? parseFloat(weightMatch[1]) / 100 : null;

      if (lowerLine.match(/\b(quiz|quizz)/i) && !lowerLine.match(/exam|midterm|final/i)) {
        assignments.push({
          title: line.substring(0, 100).trim(),
          dueDate: normalizedDate,
          weight,
          type: 'quiz',
        });
      } else if (lowerLine.match(/\b(hw|homework|assignment|ps\d|problem\s*set|project|dp\d|lab|activity)/i)) {
        const type = lowerLine.match(/\b(project|dp\d)/i) ? 'project' :
                     lowerLine.match(/\blab/i) ? 'lab' :
                     lowerLine.match(/\b(problem\s*set|ps\d)/i) ? 'assignment' :
                     lowerLine.match(/\bactivity/i) ? 'assignment' : 'homework';
        assignments.push({
          title: line.substring(0, 100).trim(),
          dueDate: normalizedDate,
          weight,
          type,
        });
      } else if (lowerLine.match(/\b(exam|midterm|final|test)\b/i)) {
        exams.push({
          title: line.substring(0, 100).trim(),
          date: normalizedDate,
          weight,
        });
      } else if (lowerLine.match(/\b(due|deadline|drop|break|holiday|reading\s*day)/i)) {
        importantDates.push({
          event: line.substring(0, 100).trim(),
          date: normalizedDate,
        });
      }
    }
  }

  const gradeWeightLines = lines.filter(l =>
    l.match(/(\d+(?:\.\d+)?)%/) &&
    l.match(/\b(exam|quiz|homework|project|participation|attendance|final|midterm|assignment|design|activity|paper|presentation)/i)
  );

  const gradeWeights: Record<string, number> = {};

  for (const line of gradeWeightLines) {
    const weightMatch = line.match(/(\d+(?:\.\d+)?)%/);
    if (!weightMatch) continue;

    const weight = parseFloat(weightMatch[1]) / 100;
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes('exam') && !lowerLine.includes('final')) gradeWeights['Exams'] = weight;
    else if (lowerLine.includes('final')) gradeWeights['Final Exam'] = weight;
    else if (lowerLine.includes('midterm')) gradeWeights['Midterms'] = weight;
    else if (lowerLine.includes('quiz')) gradeWeights['Quizzes'] = weight;
    else if (lowerLine.includes('homework') || lowerLine.includes('assignment')) gradeWeights['Homework'] = weight;
    else if (lowerLine.includes('project') || lowerLine.includes('design')) gradeWeights['Projects'] = weight;
    else if (lowerLine.includes('participation')) gradeWeights['Participation'] = weight;
    else if (lowerLine.includes('activity') || lowerLine.includes('activities')) gradeWeights['Activities'] = weight;
    else if (lowerLine.includes('paper') || lowerLine.includes('presentation')) gradeWeights['Paper/Presentation'] = weight;
  }

  return { assignments, exams, gradeWeights, importantDates };
}

function mergeAIAndRegex(aiResult: ParsedSyllabus, regexResult: Partial<ParsedSyllabus>): ParsedSyllabus {
  const merged = { ...aiResult };

  if (regexResult.assignments) {
    const existingTitles = new Set(aiResult.assignments.map(a => a.title.toLowerCase()));
    for (const regexAssignment of regexResult.assignments) {
      if (!existingTitles.has(regexAssignment.title.toLowerCase())) {
        merged.assignments.push(regexAssignment);
      }
    }
  }

  if (regexResult.exams) {
    const existingTitles = new Set(aiResult.exams.map(e => e.title.toLowerCase()));
    for (const regexExam of regexResult.exams) {
      if (!existingTitles.has(regexExam.title.toLowerCase())) {
        merged.exams.push(regexExam);
      }
    }
  }

  if (regexResult.gradeWeights && Object.keys(regexResult.gradeWeights).length > 0) {
    merged.gradeWeights = { ...merged.gradeWeights, ...regexResult.gradeWeights };
  }

  const totalWeight = Object.values(merged.gradeWeights).reduce((sum, w) => sum + w, 0);
  if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.15) {
    const scale = 1.0 / totalWeight;
    for (const key in merged.gradeWeights) {
      merged.gradeWeights[key] = Math.round(merged.gradeWeights[key] * scale * 100) / 100;
    }
  }

  return merged;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const fileHash = await computeSHA256(buffer);

    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id, course_name, parsed_json')
      .eq('file_sha256', fileHash)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingCourse && existingCourse.parsed_json) {
      return new Response(JSON.stringify({
        success: true,
        courseId: existingCourse.id,
        courseName: existingCourse.course_name,
        cached: true,
        needsReview: existingCourse.course_name?.toLowerCase().includes('untitled'),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;
    const scopedText = sliceToRelevantSection(extractedText);
    const metaFromFull = extractCourseInfo(extractedText);

    let parsedData: ParsedSyllabus | null = null;

    if (geminiKey) {
      const prompt = `
You are an expert parser trained to extract structured academic data from university course syllabuses.
Your task is to read the following syllabus text and output ONLY a single valid JSON object that fits the exact schema below.

### 🧱 RULES
- Output **only JSON**, with no explanation, commentary, or text outside the JSON.
- Never include Markdown formatting, code fences, or prose.
- Be deterministic: follow the schema precisely, even if information is missing.
- Use "null" for missing values, not empty strings.
- Always use date format **YYYY-MM-DD** for every date field.
- Extract *all* assignments, exams, projects, quizzes, labs, and important dates — don't skip any even if uncertain.
- If a deadline repeats across multiple weeks, list only the first unique instance.
- For grade weights, ensure all numeric percentages sum approximately to 100 when possible.
- If multiple grading categories exist (like "Design Project" or "Participation"), normalize them into a concise key (e.g., "Projects", "Participation").
- Detect instructor names, meeting times, and semester labels explicitly.
- The key "importantDates" should include semester-wide events like "Midterm", "Final Exam", or "Fall Break".

### 🧩 SCHEMA
{
  "courseName": "string",
  "instructor": "string or null",
  "semester": "string or null",
  "assignments": [
    {
      "title": "string",
      "dueDate": "YYYY-MM-DD or null",
      "type": "assignment|exam|quiz|project|lab",
      "weight": "number or null"
    }
  ],
  "exams": [
    {
      "title": "string",
      "date": "YYYY-MM-DD or null",
      "weight": "number or null"
    }
  ],
  "gradeWeights": {
    "Category": "number"
  },
  "meetingTimes": "string or null",
  "location": "string or null",
  "importantDates": [
    {
      "event": "string",
      "date": "YYYY-MM-DD or null"
    }
  ]
}

### 📚 EXTRACTION HINTS
- Assignments often appear as "HW", "Homework", "Project", "DP", "Assignment", "Deliverable".
- Exams may appear as "Exam I", "Exam II", "Midterm", "Final Exam".
- Dates can appear in many formats (8/25, Sept 10, Dec 11, 10/4/2025) — always convert them to ISO (YYYY-MM-DD).
- Grade weights are typically listed in a section labeled "Grading Policy" or "Grading Scale".
- Include even small components like "Participation" or "Attendance" if percentages are given.
- Use your best judgment to differentiate assignments (ongoing tasks) from exams (tests).
- Preserve ordering if the syllabus is chronological (by week).

### ⚠️ VALIDATION
- Ensure JSON is strictly valid and parsable.
- No extra keys.
- No nested text or commentary.
- The output must be complete and valid JSON — **parseable without modifications**.

Syllabus:
${extractedText}`;

      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              responseMimeType: 'application/json',
            }
          }),
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (geminiText) {
            parsedData = JSON.parse(geminiText);
          }
        }
      } catch (e) {
        console.error('Gemini parsing failed:', e);
      }
    }

    if (!parsedData) {
      parsedData = {
        courseName: 'Untitled Course',
        instructor: '',
        semester: '',
        emails: [],
        officeHours: '',
        officeLocation: '',
        coordinator: '',
        assignments: [],
        exams: [],
        gradeWeights: {},
        gradeScheme: [],
        meetingTimes: '',
        location: '',
        importantDates: [],
      };
    }

    const regexResult = regexExtractor(extractedText);
    parsedData = mergeAIAndRegex(parsedData, regexResult);

    // Heuristic enrichments
    const courseMeta = extractCourseInfo(scopedText);
    const fallbackCourseName = courseMeta.courseName || metaFromFull.courseName;
    const fallbackSemester = courseMeta.semester || metaFromFull.semester;
    const fallbackInstructor = courseMeta.instructor || metaFromFull.instructor;
    const fallbackEmails = (courseMeta.emails?.length ? courseMeta.emails : metaFromFull.emails) || [];
    const fallbackOfficeHours = courseMeta.officeHours || metaFromFull.officeHours;
    const fallbackOfficeLocation = courseMeta.officeLocation || metaFromFull.officeLocation;
    const fallbackCoordinator = courseMeta.coordinator || metaFromFull.coordinator;

    if ((!parsedData.courseName || parsedData.courseName.toLowerCase().includes('untitled')) && fallbackCourseName) parsedData.courseName = fallbackCourseName;
    if (!parsedData.semester && fallbackSemester) parsedData.semester = fallbackSemester;
    if (!parsedData.instructor && fallbackInstructor) parsedData.instructor = fallbackInstructor;
    if (!(parsedData as any).emails?.length && fallbackEmails.length) (parsedData as any).emails = fallbackEmails;
    if (!(parsedData as any).officeHours && fallbackOfficeHours) (parsedData as any).officeHours = fallbackOfficeHours;
    if (!(parsedData as any).officeLocation && fallbackOfficeLocation) (parsedData as any).officeLocation = fallbackOfficeLocation;
    if (!(parsedData as any).coordinator && fallbackCoordinator) (parsedData as any).coordinator = fallbackCoordinator;

    const gradeScheme = extractGradeScheme(scopedText);
    if (gradeScheme.length > 0) {
      parsedData.gradeScheme = gradeScheme;
      parsedData.gradeWeights = gradeScheme.reduce((acc, g) => {
        acc[g.component] = g.weight / 100;
        return acc;
      }, {} as Record<string, number>);
    }

    const semesterYear = (parsedData.semester || courseMeta.semester || '2025').match(/\d{4}/)?.[0];
    const dated = extractDatedEvents(scopedText, semesterYear);
    if (dated.assignments.length > 0) {
      parsedData.assignments = [...parsedData.assignments, ...dated.assignments];
    }
    if (dated.events.length > 0) {
      const asExams: ParsedExam[] = dated.events.map(e => ({
        title: e.title,
        date: e.date,
        weight: e.weight,
        // keep type info in title; actual type mapped below
      }));
      parsedData.exams = [...parsedData.exams, ...asExams];
    }

    const colorThemes = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    const randomColor = colorThemes[Math.floor(Math.random() * colorThemes.length)];
    const needsReview = !parsedData.courseName || parsedData.courseName.toLowerCase().includes('untitled');

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        course_name: parsedData.courseName || 'Untitled Course',
        instructor: parsedData.instructor || '',
        semester: parsedData.semester || '',
        meeting_times: parsedData.meetingTimes || '',
        location: parsedData.location || '',
        instructor_email: (parsedData as any).emails ? ((parsedData as any).emails as string[]).join(', ') : null,
        office_hours: (parsedData as any).officeHours || null,
        office_location: (parsedData as any).officeLocation || null,
        coordinator: (parsedData as any).coordinator || null,
        grade_scheme_json: parsedData.gradeScheme || null,
        color_theme: randomColor,
        raw_text: extractedText,
        file_sha256: fileHash,
        parsed_json: parsedData,
      })
      .select()
      .single();

    if (courseError) throw courseError;

    const courseId = course.id;

    if (parsedData.assignments && parsedData.assignments.length > 0) {
      const assignments = parsedData.assignments.map((a) => ({
        course_id: courseId,
        title: a.title,
        due_date: a.dueDate,
        weight: a.weight || 0,
        type: a.type || 'homework',
      }));
      await supabase.from('assignments').insert(assignments);
    }

    if (parsedData.exams && parsedData.exams.length > 0) {
      const exams = parsedData.exams.map((e) => ({
        course_id: courseId,
        title: e.title,
        exam_date: e.date,
        weight: e.weight || 0,
        type: e.title.toLowerCase().includes('final') ? 'final' : 'midterm',
      }));
      await supabase.from('exams').insert(exams);
    }

    if (parsedData.gradeWeights && Object.keys(parsedData.gradeWeights).length > 0) {
      const weights = Object.entries(parsedData.gradeWeights).map(([category, weight]) => ({
        course_id: courseId,
        category,
        // store as fraction if looks like percentage
        weight: typeof weight === 'number' && weight > 1 ? weight / 100 : (typeof weight === 'number' ? weight : parseFloat(weight as string) || 0),
      }));
      await supabase.from('grade_weights').insert(weights);
    } else if (parsedData.gradeScheme && parsedData.gradeScheme.length > 0) {
      const weights = parsedData.gradeScheme.map((g) => ({
        course_id: courseId,
        category: g.component,
        weight: (g.weight || 0) / 100,
      }));
      await supabase.from('grade_weights').insert(weights);
    }

    if (parsedData.importantDates && parsedData.importantDates.length > 0) {
      const dates = parsedData.importantDates
        .filter(d => d.date)
        .map((d) => ({
          course_id: courseId,
          event: d.event,
          date: d.date,
        }));
      if (dates.length > 0) {
        await supabase.from('important_dates').insert(dates);
      }
    }

      return new Response(JSON.stringify({
        success: true,
        courseId,
        courseName: parsedData.courseName,
        instructor: parsedData.instructor,
        semester: parsedData.semester,
        gradeScheme: parsedData.gradeScheme,
        needsReview,
        cached: false
      }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error parsing syllabus:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
