# Backend Testing Guide

This guide will help you verify the global scoreboard backend is working correctly before proceeding with the frontend UI.

---

## Files Created So Far

### ✅ Safe to Commit:
- `supabase/setup.sql` - Database schema
- `supabase/functions/submit-score/index.ts` - Edge Function code
- `supabase/SETUP_INSTRUCTIONS.md` - Setup guide
- `js/config/supabase-config.js` - **Contains anon key (SAFE for client-side)**
- `js/utils/supabase-client.js` - Client utility
- `js/utils/scoreboard-storage.js` (modified) - Added submission tracking

### ✅ Properly Ignored by Git:
- `.env` - Contains credentials (already in .gitignore ✓)

**Note:** The Supabase anon key in `supabase-config.js` is safe to commit. It's designed for browser use and protected by RLS policies.

---

## Test 1: Verify Database is Set Up

### Via Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/mryuykhdoigmviqnwrwb/editor

2. You should see the `global_scores` table in the left sidebar

3. Click on it to view the structure (should show all columns)

### Via SQL Editor:

Run this query in SQL Editor:

```sql
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'global_scores'
ORDER BY ordinal_position;
```

**Expected Result:** List of all columns (id, user_id, player_name, score_data, etc.)

---

## Test 2: Verify RLS Policies

Run this in SQL Editor:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'global_scores';
```

**Expected Result:** Should show 3 policies:
- "Public read access" (SELECT)
- "Insert for anonymous users" (INSERT)
- "Insert for authenticated users" (INSERT)

---

## Test 3: Test Score Submission (via curl)

Open PowerShell or Command Prompt and run:

```powershell
curl -X POST https://mryuykhdoigmviqnwrwb.supabase.co/functions/v1/submit-score `
  -H "Content-Type: application/json" `
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yeXV5a2hkb2lnbXZpcW53cndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDk2NDQsImV4cCI6MjA3OTU4NTY0NH0.qqe5aJ_axUhk1JyTi3PSm70TMe0M-BHi8xya3rnUBZY" `
  -d '{\"player_name\":\"TestPlayer\",\"score_data\":{\"level\":10,\"time\":300,\"enemiesKilled\":150,\"bossesKilled\":2,\"chestsCollected\":5},\"game_version\":\"1.0.0\",\"major_version\":\"1.0\",\"client_fingerprint\":\"test-fp-123\"}'
```

**Expected Success Response:**
```json
{
  "success": true,
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "is_anonymous": true
}
```

**If you get an error**, check:
- Edge Function is deployed correctly
- API key matches your project
- URL is correct (mryuykhdoigmviqnwrwb.supabase.co)

---

## Test 4: Verify Score Was Saved

Run this in SQL Editor:

```sql
SELECT
  id,
  player_name,
  score_data->>'level' as level,
  score_data->>'time' as time,
  score_data->>'enemiesKilled' as enemies,
  game_version,
  submission_date,
  is_anonymous,
  client_fingerprint
FROM global_scores
ORDER BY submission_date DESC
LIMIT 5;
```

**Expected Result:** Should show your test submission with:
- player_name: "TestPlayer"
- level: 10
- time: 300
- enemies: 150
- is_anonymous: true

---

## Test 5: Test Rate Limiting

Try submitting the **same score again** (rerun the curl command from Test 3).

**Expected Response:**
```json
{
  "success": false,
  "error": "Duplicate submission detected. Please wait before resubmitting."
}
```

Try submitting **5 more times** with different data (change level to 11, 12, 13, 14, 15).

On the **6th submission within 1 hour**, you should get:
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please wait before submitting again."
}
```

---

## Test 6: Test Query (Read Access)

Run this in SQL Editor to test the leaderboard query:

```sql
SELECT * FROM get_global_leaderboard('1.0', 10, 0);
```

**Expected Result:** Top 10 scores for version 1.0, with rank numbers.

---

## Test 7: Test Invalid Submissions

### Test 7a: Invalid Player Name (too short)

```powershell
curl -X POST https://mryuykhdoigmviqnwrwb.supabase.co/functions/v1/submit-score `
  -H "Content-Type: application/json" `
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yeXV5a2hkb2lnbXZpcW53cndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDk2NDQsImV4cCI6MjA3OTU4NTY0NH0.qqe5aJ_axUhk1JyTi3PSm70TMe0M-BHi8xya3rnUBZY" `
  -d '{\"player_name\":\"AB\",\"score_data\":{\"level\":10,\"time\":300,\"enemiesKilled\":150,\"bossesKilled\":2},\"game_version\":\"1.0.0\",\"major_version\":\"1.0\",\"client_fingerprint\":\"test-fp-456\"}'
```

**Expected:** Error "Player name must be 3-20 characters"

### Test 7b: Invalid Score Data (level too high)

```powershell
curl -X POST https://mryuykhdoigmviqnwrwb.supabase.co/functions/v1/submit-score `
  -H "Content-Type: application/json" `
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yeXV5a2hkb2lnbXZpcW53cndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDk2NDQsImV4cCI6MjA3OTU4NTY0NH0.qqe5aJ_axUhk1JyTi3PSm70TMe0M-BHi8xya3rnUBZY" `
  -d '{\"player_name\":\"TestPlayer\",\"score_data\":{\"level\":999,\"time\":300,\"enemiesKilled\":150,\"bossesKilled\":2},\"game_version\":\"1.0.0\",\"major_version\":\"1.0\",\"client_fingerprint\":\"test-fp-789\"}'
```

**Expected:** Error "Invalid level (must be 1-100)"

---

## Test 8: Check Edge Function Logs

1. Go to: https://supabase.com/dashboard/project/mryuykhdoigmviqnwrwb/functions/submit-score/logs

2. You should see logs for all your test submissions

3. Verify no unexpected errors appear

---

## Troubleshooting

### "Permission denied" errors
- Verify RLS policies are enabled (Test 2)
- Check that anon key is correct in curl commands

### "404 Not Found" on Edge Function
- Verify Edge Function is deployed
- Check URL is correct: `https://mryuykhdoigmviqnwrwb.supabase.co/functions/v1/submit-score`

### "CORS error" (if testing from browser)
- Edge Function already includes CORS headers
- Should not occur with curl/Postman

### Duplicate errors immediately
- Wait 5 minutes between identical submissions
- Or change the score data slightly

---

## Summary Checklist

Before proceeding to frontend UI, verify:

- [ ] Database table exists with all columns
- [ ] RLS policies are enabled and correct
- [ ] Edge Function successfully accepts valid submissions
- [ ] Edge Function rejects invalid submissions (name, level, etc.)
- [ ] Rate limiting works (5 submissions per hour per fingerprint)
- [ ] Duplicate detection works (5 minute window)
- [ ] Scores are queryable via SQL
- [ ] Edge Function logs show no errors

---

## Next Steps

Once all tests pass:

1. **Git Save**: Commit the backend files
   ```bash
   git add .
   git commit -m "feat: Add global scoreboard backend (Supabase integration)

   - Database schema with RLS policies
   - Edge Function for score validation and submission
   - Supabase client utility and config
   - Updated scoreboard storage with submission tracking"
   git push
   ```

2. **Continue with Frontend**: Implement the UI (tabs, submit buttons, etc.)

---

**Questions or Issues?**
- Check Edge Function logs in Supabase dashboard
- Review SQL query results for data verification
- Test one more time with fresh fingerprint after 1 hour if rate limited
