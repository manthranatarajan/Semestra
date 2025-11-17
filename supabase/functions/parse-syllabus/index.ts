import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import pdf from 'npm:pdf-parse@1.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ParsedSyllabus {
  courseName: string;
  instructor: string;
  semester: string;
  assignments: Array<{
    title: string;
    dueDate: string;
    weight: string;
    type: string;
  }>;
  exams: Array<{
    title: string;
    date: string;
    weight: string;
  }>;
  gradeWeights: Record<string, number>;
  meetingTimes: string;
  location: string;
  importantDates: Array<{
    event: string;
    date: string;
  }>;
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
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiUrl = Deno.env.get('GEMINI_API_URL');

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
    const data = await pdf(buffer);
    const extractedText = data.text;

    let parsedData: ParsedSyllabus;

    const prompt = `You are an expert at parsing college syllabuses. Extract ALL structured information from the following syllabus text and return ONLY valid JSON with no markdown formatting or code blocks.

CRITICAL PARSING REQUIREMENTS:
1. Extract EVERY assignment mentioned, including:
   - Weekly quizzes (every week/bi-weekly quizzes)
   - Homework assignments
   - Projects
   - Labs
   - Problem sets
   - Discussion posts
   - Any recurring assignments

2. For recurring items (e.g., "Weekly Quiz every Monday"):
   - Create individual entries for each occurrence
   - Infer dates based on day of week and semester schedule
   - Label clearly (e.g., "Quiz 1", "Quiz 2", etc.)

3. Parse ALL types of assessments:
   - Quizzes (in-class, online, weekly)
   - Homework/Problem Sets
   - Projects
   - Labs
   - Exams (midterms, finals, practicals)
   - Presentations
   - Papers

4. Extract precise information:
   - Course name, instructor, semester
   - Meeting times and location
   - ALL due dates and exam dates
   - Individual weights for each item
   - Category weights (Exams: X%, Homework: Y%, Quizzes: Z%)

For dates: Use YYYY-MM-DD format. If year is ambiguous, infer from context or use 2024.
For weights: Convert percentages to decimals (e.g., 20% = 0.2).
For recurring items: Generate individual entries with sequential numbering.

Return this exact JSON structure:
{
  "courseName": "",
  "instructor": "",
  "semester": "",
  "assignments": [{"title": "", "dueDate": "", "weight": "", "type": ""}],
  "exams": [{"title": "", "date": "", "weight": ""}],
  "gradeWeights": {"Exams": 0.4, "Homework": 0.2, "Quizzes": 0.1},
  "meetingTimes": "",
  "location": "",
  "importantDates": [{"event": "", "date": ""}]
}

Syllabus text:
${extractedText}`;

    if (geminiKey && geminiUrl) {
      const geminiResponse = await fetch(`${geminiUrl}?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
          }
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API error:', errorText);
        throw new Error('Gemini API request failed');
      }

      const geminiData = await geminiResponse.json();
      const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : geminiText);
    } else if (openaiKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error('OpenAI API request failed');
      }

      const openaiData = await openaiResponse.json();
      const content = openaiData.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } else {
      parsedData = fallbackParse(extractedText);
    }

    const colorThemes = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    const randomColor = colorThemes[Math.floor(Math.random() * colorThemes.length)];

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        course_name: parsedData.courseName || 'Untitled Course',
        instructor: parsedData.instructor || '',
        semester: parsedData.semester || '',
        meeting_times: parsedData.meetingTimes || '',
        location: parsedData.location || '',
        color_theme: randomColor,
        raw_text: extractedText,
      })
      .select()
      .single();

    if (courseError) throw courseError;

    const courseId = course.id;

    if (parsedData.assignments && parsedData.assignments.length > 0) {
      const assignments = parsedData.assignments.map((a) => ({
        course_id: courseId,
        title: a.title,
        due_date: a.dueDate || null,
        weight: parseFloat(a.weight) || 0,
        type: a.type || 'homework',
      }));
      await supabase.from('assignments').insert(assignments);
    }

    if (parsedData.exams && parsedData.exams.length > 0) {
      const exams = parsedData.exams.map((e) => ({
        course_id: courseId,
        title: e.title,
        exam_date: e.date || null,
        weight: parseFloat(e.weight) || 0,
        type: e.title.toLowerCase().includes('final') ? 'final' : 'midterm',
      }));
      await supabase.from('exams').insert(exams);
    }

    if (parsedData.gradeWeights && Object.keys(parsedData.gradeWeights).length > 0) {
      const weights = Object.entries(parsedData.gradeWeights).map(([category, weight]) => ({
        course_id: courseId,
        category,
        weight: typeof weight === 'number' ? weight : parseFloat(weight as string) || 0,
      }));
      await supabase.from('grade_weights').insert(weights);
    }

    if (parsedData.importantDates && parsedData.importantDates.length > 0) {
      const dates = parsedData.importantDates.map((d) => ({
        course_id: courseId,
        event: d.event,
        date: d.date,
      }));
      await supabase.from('important_dates').insert(dates);
    }

    return new Response(JSON.stringify({ success: true, courseId, courseName: parsedData.courseName }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error parsing syllabus:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function fallbackParse(text: string): ParsedSyllabus {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  const courseName = lines.find(l =>
    l.match(/course|class|subject/i) && !l.match(/schedule|policy/i)
  ) || 'Untitled Course';

  const instructor = lines.find(l => l.match(/instructor|professor|teacher/i)) || '';
  const semester = lines.find(l => l.match(/fall|spring|summer|winter|semester/i)) || '';

  const assignments: ParsedSyllabus['assignments'] = [];
  const exams: ParsedSyllabus['exams'] = [];
  const importantDates: ParsedSyllabus['importantDates'] = [];

  const datePattern = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i;
  const weightPattern = /(\d+(?:\.\d+)?)%/;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    const weightMatch = line.match(weightPattern);
    const lowerLine = line.toLowerCase();

    if (lowerLine.match(/quiz(?:zes)?|quizz/i) && dateMatch) {
      assignments.push({
        title: line.substring(0, 50).trim(),
        dueDate: dateMatch[0],
        weight: weightMatch ? (parseFloat(weightMatch[1]) / 100).toString() : '0.02',
        type: 'quiz',
      });
    } else if (lowerLine.match(/homework|hw\s|assignment|problem\s+set|ps\d|project|lab|dp/i) && dateMatch) {
      const type = lowerLine.match(/project|dp/i) ? 'project' :
                   lowerLine.match(/lab/i) ? 'lab' :
                   lowerLine.match(/problem\s+set|ps\d/i) ? 'problem set' : 'homework';
      assignments.push({
        title: line.substring(0, 50).trim(),
        dueDate: dateMatch[0],
        weight: weightMatch ? (parseFloat(weightMatch[1]) / 100).toString() : '0.05',
        type,
      });
    } else if (lowerLine.match(/exam|midterm|final|test/i) && dateMatch) {
      exams.push({
        title: line.substring(0, 50).trim(),
        date: dateMatch[0],
        weight: weightMatch ? (parseFloat(weightMatch[1]) / 100).toString() : '0.2',
      });
    } else if (dateMatch && lowerLine.match(/due|deadline|submit/i)) {
      importantDates.push({
        event: line.substring(0, 50).trim(),
        date: dateMatch[0],
      });
    }
  }

  const hasQuizzes = assignments.some(a => a.type === 'quiz');
  const gradeWeights: Record<string, number> = hasQuizzes ? {
    'Assignments': 0.3,
    'Quizzes': 0.2,
    'Exams': 0.4,
    'Participation': 0.1,
  } : {
    'Assignments': 0.3,
    'Exams': 0.5,
    'Participation': 0.2,
  };

  return {
    courseName: courseName.substring(0, 100),
    instructor: instructor.substring(0, 100),
    semester: semester.substring(0, 50),
    assignments,
    exams,
    gradeWeights,
    meetingTimes: '',
    location: '',
    importantDates,
  };
}