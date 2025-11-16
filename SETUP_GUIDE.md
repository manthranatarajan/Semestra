# Smart Syllabus - Setup Guide

This guide will help you fix the blank screen issue and get Smart Syllabus running locally.

## Problem Overview

The blank white screen occurs when:
- Environment variables are not properly configured
- Vite cannot access the Supabase credentials
- The Supabase client throws an error during initialization

## Solution

### 1. Check Your .env File

Make sure you have a `.env` file in your project root with these variables:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important Notes:**
- Variable names MUST start with `VITE_` for Vite to expose them to the frontend
- The `.env` file must be in the root directory (same level as `package.json`)
- Never use `NEXT_PUBLIC_` prefix - this project uses Vite, not Next.js

### 2. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **Settings** (gear icon in sidebar)
4. Click on **API**
5. Copy these values:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public key** → Use as `VITE_SUPABASE_ANON_KEY`

**Do NOT use:**
- Service Role key (keep this secret!)
- Project Reference ID

### 3. Restart Development Server

After creating or modifying the `.env` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

Vite only reads environment variables at startup, so you MUST restart after changes.

### 4. Verify Connection

Open your browser console (F12) and look for:

✅ **Success indicators:**
```
✅ Supabase client initialized with: https://your-project.supabase.co
✅ Supabase connection test successful
```

❌ **Error indicators:**
```
❌ Missing Supabase environment variables
VITE_SUPABASE_URL: ✗ Missing
VITE_SUPABASE_ANON_KEY: ✗ Missing
```

## Fixed Issues

### 1. Enhanced Error Handling

The Supabase client now provides detailed error messages instead of crashing silently:

```typescript
// Before: Silent crash
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// After: Detailed logging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
  // ... helpful instructions
}
```

### 2. Error Boundary

Added a React Error Boundary that catches initialization errors and shows a helpful UI:

- Clear error message explaining what went wrong
- Visual guide showing required environment variables
- Instructions for fixing the issue
- Reload button to retry after fixing

### 3. Loading State

Improved loading screen that shows while initializing:

- Smart Syllabus logo
- Loading spinner
- "Loading Smart Syllabus..." message

### 4. Connection Testing

Automatic connection test on startup:

```typescript
const connectionResult = await testSupabaseConnection();
if (!connectionResult.success) {
  console.warn('⚠️ Supabase connection check failed, but continuing...');
}
```

### 5. Updated Documentation

- Comprehensive README.md with troubleshooting section
- Detailed .env.example with clear instructions
- Setup guide (this document) for common issues

## Troubleshooting

### Issue: Still seeing blank white screen

**Solution:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Follow the instructions in the error message

### Issue: "Missing Supabase environment variables"

**Solution:**
1. Verify `.env` file exists in project root
2. Check variable names start with `VITE_`
3. Ensure no extra spaces around the `=` sign
4. Restart development server with `npm run dev`

### Issue: "Failed to load resource: net::ERR_FILE_NOT_FOUND"

**Solution:**
This usually means:
1. The `.env` file is not being read
2. You're trying to access files that don't exist
3. The build output is incorrect

Try:
```bash
# Clear build cache
rm -rf dist node_modules/.vite

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Restart dev server
npm run dev
```

### Issue: Connection successful but can't sign in

**Solution:**
1. Check that email confirmation is disabled in Supabase:
   - Dashboard → Authentication → Settings
   - Uncheck "Enable email confirmations"
2. Try creating a new account with sign up
3. Check the console for specific auth errors

### Issue: CORS errors when uploading PDFs

**Solution:**
The Edge Function already has CORS headers configured. If you see CORS errors:
1. Verify the Edge Function is deployed
2. Check the function URL in browser DevTools
3. Ensure you're using the correct Supabase URL

## Environment Variables Reference

### Frontend (Required)

```env
# Vite exposes these to the browser
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Backend/Edge Functions (Optional)

These are configured separately in Supabase Dashboard:

```bash
# Set via Supabase CLI or Dashboard
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GEMINI_API_KEY=...
```

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   - Navigate to `http://localhost:5173`
   - Open DevTools (F12)

3. **Check Console**
   - Look for ✅ success messages
   - Look for ❌ error messages

4. **Test Features**
   - Sign up with email/password
   - Upload a PDF syllabus
   - View parsed course data

## Production Deployment

### Environment Variables

When deploying to production (Vercel, Netlify, etc.):

1. Add environment variables in your hosting dashboard
2. Use the same variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Rebuild and redeploy

### Build Command
```bash
npm run build
```

### Output Directory
```
dist/
```

## Need More Help?

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify your Supabase project is active and accessible
3. Try the connection test endpoint (if implemented)
4. Review the detailed error message shown in the Error Boundary UI

## Summary of Fixes

✅ **Fixed environment variable handling**
- Proper Vite variable naming (`VITE_` prefix)
- Detailed error logging
- Clear console messages

✅ **Added Error Boundary**
- Catches initialization errors
- Shows helpful UI with instructions
- Provides reload functionality

✅ **Improved Loading State**
- Branded splash screen
- Clear loading indicator
- Better user experience

✅ **Added Connection Testing**
- Automatic health check on startup
- Logs connection status
- Warns if connection fails

✅ **Enhanced Documentation**
- Comprehensive README
- Detailed .env.example
- This setup guide

Your app should now load properly instead of showing a blank white screen!
