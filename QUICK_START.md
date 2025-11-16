# Smart Syllabus - Quick Start

## If You're Seeing a Blank Screen

The issue has been fixed! Follow these steps:

### 1. Check Your .env File (30 seconds)

```bash
# Check if it exists
ls -la .env

# View contents (careful - contains secrets!)
cat .env
```

Should contain:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. If .env is Missing or Wrong

```bash
# Copy the example
cp .env.example .env

# Edit with your values
nano .env
```

Get your values from [Supabase Dashboard](https://app.supabase.com) → Settings → API

### 3. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 4. Check Browser Console

Open your browser at `http://localhost:5173`

Press **F12** to open DevTools → Console tab

**Look for:**
```
✅ Supabase client initialized with: https://xxxxx.supabase.co
```

## What's Fixed

1. **Better Error Messages** - Console shows exactly what's missing
2. **Error Boundary** - Helpful UI instead of blank screen
3. **Loading Screen** - Branded splash screen during startup
4. **Connection Testing** - Automatic health check

## Common Issues

### Still seeing blank screen?

1. Check console for errors (F12 → Console)
2. Verify variable names start with `VITE_`
3. Restart dev server
4. Clear cache: `rm -rf node_modules/.vite`

### Variables not loading?

- Must be named `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
- Must be named `VITE_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)
- Must restart server after changing .env

### Connection fails?

- Verify Supabase project is active
- Use anon key, not service role key
- Check URL format: `https://xxxxx.supabase.co`

## Need More Help?

Read these guides:
- **SETUP_GUIDE.md** - Detailed troubleshooting
- **FIX_SUMMARY.md** - What was fixed and why
- **README.md** - Full documentation

## Ready to Use?

Once the app loads:

1. **Sign Up** with email/password
2. **Upload** a PDF syllabus
3. **Watch** AI parse it automatically
4. **Explore** your course dashboard

That's it! You're ready to go.
