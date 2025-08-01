# 🚨 IMMEDIATE 401 FIX - Stop Errors Now

## ⚡ 5-Minute Emergency Fix

Your 401 errors are happening because tokens expire every hour and there's no refresh mechanism. Here's the fastest fix:

### Step 1: Update Supabase Client (2 minutes)

```typescript
// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Refresh token 5 minutes before expiry
        refreshTokenMarginSecs: 300,
        // Enable debug mode to see what's happening
        debug: process.env.NODE_ENV === 'development'
      }
    }
  )
}
```

### Step 2: Create Auth Fetch Wrapper (3 minutes)

```typescript
// src/utils/authFetch.ts
import { createClient } from '@/utils/supabase/client';

export async function authFetch(url: string, options: RequestInit = {}) {
  const supabase = createClient();
  
  // Get fresh session (Supabase will auto-refresh if needed)
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('Authentication required');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  });
}
```

### Step 3: Replace ONE API Call to Test

Find this pattern in your code:
```typescript
// OLD - This causes 401 errors
const response = await fetch(`${BACKEND_URL}/subscription/status`, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  }
});
```

Replace with:
```typescript
// NEW - This fixes 401 errors
import { authFetch } from '@/utils/authFetch';

const response = await authFetch(`${BACKEND_URL}/subscription/status`);
```

## 🎯 Test Your Fix

1. **Save the files above**
2. **Restart your Next.js dev server**: `Ctrl+C` then `npm run dev`
3. **Open browser console**
4. **Look for these logs**:
   ```
   ✅ "Token refreshed successfully"
   ✅ No more 401 errors
   ✅ Smooth API calls
   ```

## 📍 Where to Find API Calls

Search your codebase for these patterns:
```bash
# Find files with auth headers
grep -r "Authorization.*Bearer" src/

# Find files with manual token usage
grep -r "session.*access_token" src/

# Find fetch calls to your backend
grep -r "BACKEND_URL" src/
```

Common files to update:
- `src/hooks/use-infiniteScroll.tsx`
- `src/components/dashboard/settings/subscription/`
- Any component making API calls

## 🔄 Progressive Rollout

**Phase 1: Fix Critical Endpoints**
- `/subscription/status` (causing most 401s)
- `/profile` endpoints
- Any dashboard data loading

**Phase 2: Fix All API Calls**
- Replace all manual `fetch` with `authFetch`
- Update hooks and components
- Test each section

**Phase 3: Add Error Handling**
- Global error boundary
- User-friendly retry options
- Fallback states

## 🚀 Expected Results

After implementing Step 1-3:
- **401 errors stop immediately**
- **Smooth user experience**
- **Automatic token refresh**
- **No login interruptions**

Your logs should show:
```
✅ [FLASK] 2025-08-01 15:45:00 - app - INFO - Outgoing Response: GET /subscription/status - Status 200
✅ [FLASK] 2025-08-01 15:45:05 - app - INFO - Outgoing Response: GET /subscription/status - Status 200
✅ [FLASK] 2025-08-01 15:45:10 - app - INFO - Outgoing Response: GET /subscription/status - Status 200
```

Instead of:
```
❌ [FLASK] Authentication failed: Stale JWT from IP 127.0.0.1
❌ [FLASK] Status 401
```

## 🆘 If It Still Doesn't Work

1. **Check browser console** for Supabase auth logs
2. **Verify environment variables** are set correctly
3. **Clear browser storage**: `localStorage.clear()`
4. **Hard refresh**: `Ctrl+Shift+R`

## 📞 Need Help?

If you're still getting 401 errors after this fix:
1. Share the browser console logs
2. Show the exact API call that's failing
3. Check if Supabase auth is working: `supabase.auth.getSession()`

This should fix your 401 errors **immediately**! 🎉