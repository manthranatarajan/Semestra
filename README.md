https://www.loom.com/share/11d9696f818041b18c0fe7c9b9cfb794

# Smart Syllabus

AI-powered syllabus parser and course management system. Upload your course syllabuses and automatically extract assignments, exams, deadlines, and grade weights.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Where to find these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Settings → API
4. Copy the URL and anon/public key

### 3. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## Features

- **AI-Powered Parsing**: Upload PDF syllabuses and automatically extract course information
- **Timeline View**: Visual timeline of all assignments and exams
- **Grade Predictor**: Calculate current grades and predict final grades with what-if scenarios
- **Calendar View**: Monthly calendar with export to .ics functionality
- **Authentication**: Secure user authentication with Supabase

## Troubleshooting

### Blank White Screen

If you see a blank white screen, check the browser console for errors:

1. **Missing Environment Variables**: Ensure `.env` file exists with correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. **Restart Dev Server**: After changing `.env`, restart with `npm run dev`
3. **Check Console**: Open browser DevTools (F12) and look for error messages

### Connection Issues

If Supabase connection fails:

1. Verify your `.env` file has the correct values
2. Check that your Supabase project is active
3. Ensure you're using the anon/public key, not the service role key
4. Restart the development server

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **AI**: OpenAI GPT-4-Turbo / Google Gemini
- **Charts**: Chart.js, react-chartjs-2

## Project Structure

```
src/
├── components/          # React components
│   ├── LandingPage.tsx  # Landing page with auth
│   ├── Dashboard.tsx    # Main dashboard
│   ├── CourseDetail.tsx # Course detail view
│   ├── Timeline.tsx     # Timeline component
│   ├── GradePredictor.tsx # Grade calculator
│   ├── CalendarView.tsx # Calendar component
│   └── UploadModal.tsx  # PDF upload modal
├── context/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   └── supabase.ts      # Supabase client
└── App.tsx              # Main app component

supabase/
├── functions/
│   └── parse-syllabus/  # Edge function for PDF parsing
└── migrations/          # Database migrations
```
