# Smart Syllabus - Deployment Checklist

## Pre-Deployment Verification

### Local Development
- [ ] `.env` file exists with correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Run `npm install` to install all dependencies
- [ ] Run `npm run dev` - app loads without blank screen
- [ ] Browser console shows: `✅ Supabase client initialized with: ...`
- [ ] No red error messages in console
- [ ] Can sign up / sign in successfully
- [ ] Can upload a PDF syllabus
- [ ] PDF parsing works (OpenAI or fallback)
- [ ] Dashboard shows uploaded courses
- [ ] Can view course details
- [ ] Timeline, Grade Predictor, and Calendar views work

### Build Verification
- [ ] Run `npm run build` - completes without errors
- [ ] Run `npm run preview` - production build works locally
- [ ] Check `dist/` folder exists with built files

## Deployment Steps

### Option 1: Vercel

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import your Git repository
   - Select the project

2. **Configure Environment Variables**
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

3. **Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Test the deployed URL

### Option 2: Netlify

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://netlify.com)
   - Import from Git
   - Select your repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add:
     ```
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGc...
     ```

4. **Deploy**
   - Trigger new deploy
   - Test the deployed URL

### Option 3: Custom Server

1. **Build Project**
   ```bash
   npm run build
   ```

2. **Upload `dist/` folder** to your server

3. **Configure Web Server**
   - Nginx example:
     ```nginx
     server {
       listen 80;
       server_name yourdomain.com;
       root /path/to/dist;
       index index.html;

       location / {
         try_files $uri $uri/ /index.html;
       }
     }
     ```

4. **Environment Variables**
   - Variables are baked into the build
   - Set them locally before running `npm run build`

## Post-Deployment Verification

### Functionality Checklist
- [ ] Visit deployed URL - no blank screen
- [ ] Open browser console - no errors
- [ ] Can access landing page
- [ ] Sign up creates new account
- [ ] Sign in works with existing account
- [ ] Upload modal opens
- [ ] PDF upload triggers Edge Function
- [ ] Course appears in dashboard
- [ ] Can navigate to course detail
- [ ] All tabs (Timeline, Grades, Calendar, Raw) work
- [ ] Can toggle assignment completion
- [ ] Grade predictor calculates correctly
- [ ] Calendar export downloads .ics file

### Performance Checks
- [ ] Page loads in < 3 seconds
- [ ] No console warnings or errors
- [ ] Images and assets load correctly
- [ ] Animations run smoothly
- [ ] Mobile responsive design works

### Security Checks
- [ ] Using anon key (not service role key)
- [ ] RLS policies are enabled on all tables
- [ ] Authentication required for protected routes
- [ ] Edge Function requires authentication
- [ ] No secrets exposed in client code

## Supabase Edge Function Deployment

The Edge Function is already deployed via MCP tools, but if you need to redeploy:

### Via Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-id

# Deploy function
supabase functions deploy parse-syllabus

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-xxx
```

### Via Supabase Dashboard
1. Go to Edge Functions
2. Create new function: `parse-syllabus`
3. Copy code from `supabase/functions/parse-syllabus/index.ts`
4. Deploy
5. Set secrets in Environment Variables

## Common Deployment Issues

### Issue: Blank screen after deployment
**Solution:**
- Verify environment variables are set in hosting dashboard
- Variables must include `VITE_` prefix
- Rebuild and redeploy after setting variables

### Issue: 404 on refresh
**Solution:**
- Configure hosting to redirect all routes to `index.html`
- Vercel: Add `vercel.json` with rewrites
- Netlify: Add `_redirects` file

### Issue: API calls fail
**Solution:**
- Check Supabase URL is correct
- Verify anon key is valid
- Ensure RLS policies allow access
- Check browser console for specific errors

### Issue: Edge Function not working
**Solution:**
- Verify function is deployed
- Check function logs in Supabase Dashboard
- Ensure CORS headers are present
- Test function URL directly

## Environment Variable Management

### Development
```env
# .env (local only, not committed)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Production
Set in hosting provider dashboard:
- Vercel: Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Custom: Set before building

### Staging (Optional)
Create separate Supabase project for staging:
```env
# .env.staging
VITE_SUPABASE_URL=https://staging-xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## Monitoring

### After Deployment
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor Supabase usage dashboard
- [ ] Check Edge Function logs regularly
- [ ] Set up uptime monitoring
- [ ] Review user feedback

### Supabase Dashboard
- Database → Check table sizes
- Authentication → Monitor user signups
- Edge Functions → Check invocation count and errors
- API → Monitor API usage

## Rollback Plan

If deployment fails:

1. **Immediate Rollback**
   - Vercel: Redeploy previous deployment
   - Netlify: Restore previous deploy
   - Custom: Restore previous `dist/` folder

2. **Fix Issues**
   - Check deployment logs
   - Review error messages
   - Test locally first
   - Fix and redeploy

## Success Criteria

Your deployment is successful when:

✅ Users can access the site without errors
✅ Sign up and sign in work correctly
✅ PDF upload and parsing function properly
✅ All course data displays correctly
✅ Grade calculations are accurate
✅ Calendar export works
✅ No console errors
✅ Mobile responsive
✅ Fast load times (<3s)

## Next Steps

After successful deployment:

1. Test with real PDF syllabuses
2. Gather user feedback
3. Monitor error logs
4. Plan feature improvements
5. Set up analytics
6. Create user documentation
7. Implement additional features

---

**Ready to deploy?** Follow this checklist step by step!
