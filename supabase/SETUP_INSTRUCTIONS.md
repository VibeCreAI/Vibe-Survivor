# Supabase Backend Setup Instructions

Follow these steps to set up the global scoreboard backend for Vibe Survivor.

## Step 1: Set Up Database Table

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/mryuykhdoigmviqnwrwb

2. Click **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy the entire contents of `supabase/setup.sql` and paste it into the editor

5. Click **Run** (or press Ctrl+Enter)

6. You should see: "Table created successfully!" with score_count = 0

**What this does:**
- Creates `global_scores` table with auth-ready schema
- Adds performance indexes for fast leaderboard queries
- Enables Row Level Security (RLS)
- Creates policies for public read + anonymous/authenticated insert
- Creates helper function for leaderboard queries

---

## Step 2: Get Your Supabase Anon Key

You'll need this for the frontend configuration.

1. In your Supabase dashboard, go to **Settings** → **API**

2. Copy the **anon/public** key (it starts with `eyJ...`)

3. Keep this handy - you'll need it in the next steps

**Important:** The anon key is safe to expose in your frontend. RLS policies protect your database.

---

## Step 3: Deploy Edge Function

### Option A: Using Supabase CLI (Recommended)

If you have Supabase CLI installed:

```bash
cd "C:\Users\samso\OneDrive\Desktop\Vibe\Web\Vibe-Survivor"

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref mryuykhdoigmviqnwrwb

# Deploy the function
supabase functions deploy submit-score
```

After deployment, you'll get the Edge Function URL like:
`https://mryuykhdoigmviqnwrwb.supabase.co/functions/v1/submit-score`

### Option B: Manual Deployment via Dashboard

1. Go to **Edge Functions** in your Supabase dashboard

2. Click **Create a new function**

3. Name it: `submit-score`

4. Copy the contents of `supabase/functions/submit-score/index.ts`

5. Paste into the editor

6. Click **Deploy**

---

## Step 4: Test the Setup

### Test Database Connection

Run this in SQL Editor to verify the table:

```sql
SELECT * FROM public.global_scores LIMIT 10;
```

Should return empty results (0 rows) since no scores submitted yet.

### Test Edge Function

After deploying, test with curl:

```bash
curl -X POST https://mryuykhdoigmviqnwrwb.supabase.co/functions/v1/submit-score \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "player_name": "TestPlayer",
    "score_data": {
      "level": 10,
      "time": 300,
      "enemiesKilled": 150,
      "bossesKilled": 2
    },
    "game_version": "1.0.0",
    "major_version": "1.0",
    "client_fingerprint": "test-fingerprint-123"
  }'
```

Expected response:
```json
{"success": true, "id": "...", "is_anonymous": true}
```

---

## Step 5: Note Your Configuration

Once backend setup is complete, you'll need these values for frontend configuration:

- **Supabase URL**: `https://mryuykhdoigmviqnwrwb.supabase.co`
- **Anon Key**: `eyJ...` (from Step 2)
- **Edge Function URL**: `https://mryuykhdoigmviqnwrwb.supabase.co/functions/v1/submit-score`

Keep these handy for the next phase!

---

## Troubleshooting

### "Permission denied" errors
- Check that RLS policies are enabled
- Verify the anon key is correct

### Edge Function won't deploy
- Make sure you're logged in: `supabase login`
- Verify project is linked: `supabase projects list`

### Rate limit errors when testing
- Wait 1 hour between test submissions with same fingerprint
- Or use different fingerprint values for testing

---

## Next Steps

Once you've completed all 5 steps above and have your configuration values ready, let me know and we'll proceed with the frontend implementation!
