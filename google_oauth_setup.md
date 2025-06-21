# Google OAuth Setup for Walkumentary

## Quick Reference

### Your Supabase Project Details
- Project URL: `https://your-project-ref.supabase.co`
- Redirect URI for Google: `https://your-project-ref.supabase.co/auth/v1/callback`

### Development URLs
- Site URL: `http://localhost:3000`
- Frontend Redirect: `http://localhost:3000/auth/callback`

## Option 1: Use Supabase's Google OAuth (Easiest)

1. In Supabase Authentication → Providers → Google
2. Look for "Use Supabase's OAuth" or similar option
3. Enable it and set:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

## Option 2: Custom Google OAuth Setup

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project: `walkumentary`
3. Enable APIs:
   - Go to "APIs & Services" → "Library"
   - Enable "Google+ API"
   - Enable "Google Identity"

### Step 2: OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in:
   - App name: `Walkumentary`
   - User support email: Your email
   - App logo: (optional)
   - App domain: `http://localhost:3000` (for now)
   - Developer contact: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
5. Add test users: Your email address

### Step 3: Create OAuth Client

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `Walkumentary Web Client`
5. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-domain.com
   ```
6. Authorized redirect URIs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

### Step 4: Configure Supabase

1. Copy Client ID and Client Secret from Google
2. In Supabase Authentication → Providers → Google:
   - Enable Google provider: ✅
   - Client ID: `paste here`
   - Client Secret: `paste here`
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

## Testing Checklist

- [ ] Google OAuth enabled in Supabase
- [ ] Client ID and Secret configured (if using custom)
- [ ] Site URL set to `http://localhost:3000`
- [ ] Redirect URL set to `http://localhost:3000/auth/callback`
- [ ] Google Cloud project has correct redirect URI
- [ ] Your email added as test user in Google Console

## Troubleshooting

### "At least one Client ID is required"
- You need to either enable Supabase's built-in OAuth or provide your own Google OAuth credentials

### "Redirect URI mismatch"
- Make sure Google Cloud redirect URI matches: `https://your-project-ref.supabase.co/auth/v1/callback`

### "This app isn't verified"
- Normal for development - click "Advanced" → "Go to Walkumentary (unsafe)"
- Add your email as a test user in Google Console

### "Access blocked"
- Make sure your email is added as a test user in Google Cloud Console
- Check that scopes include email and profile