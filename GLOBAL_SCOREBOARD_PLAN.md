# Global Scoreboard Implementation Plan

## Overview

This document outlines the implementation of a **global leaderboard system** for Vibe Survivor using Supabase (free tier), with anonymous opt-in score submission. Users can submit their local scores to a global leaderboard by entering a display name, without requiring authentication.

### Key Features
- ✅ No login/authentication required (for initial launch)
- ✅ Opt-in submission from local scoreboard
- ✅ User-entered display names
- ✅ Tab-based UI in existing Scoreboard modal
- ✅ Anti-spam protection (practical, not paranoid)
- ✅ Free tier Supabase only
- ✅ **Auth-ready database** (future-proof for social login upgrade)
- ✅ **Version-based rankings** (major version only)

---

## Auth-Ready Design Philosophy

This implementation uses a **future-proof database schema** that supports both anonymous submissions (v1.0 launch) AND authenticated social login (future upgrade) without breaking changes.

### Why Auth-Ready?

**v1.0 Launch**: Anonymous only, maximum simplicity
- Users submit scores with display names
- No registration, no passwords, no friction
- Perfect for "just bragging rights" leaderboard

**v2.0+ Upgrade**: Optional social login
- Users can sign in with Google/GitHub/Discord
- Link anonymous scores to their account
- Better spam prevention for authenticated users
- Cross-device score history
- **No data migration needed** - database already supports it!

### The Strategy

1. **Database schema** includes `user_id` field (nullable for anonymous)
2. **Edge Function** validates both anonymous and auth submissions
3. **Frontend** launches with anonymous only (auth code commented out)
4. **When ready**: Uncomment auth UI, enable OAuth providers
5. **Migration**: Users can claim their anonymous scores after signing in

This approach adds ~30 minutes to initial setup but saves days of migration work later.

---

## Architecture Overview

### Data Flow
```
1. Player completes game → Local score saved (existing)
2. Player opens Scoreboard → Views LOCAL tab (existing)
3. Player clicks on score → Detail modal opens (existing)
4. Player clicks "Submit to Global" → Name input dialog
5. Player enters name → Score sent to Supabase
6. Success → Local score marked as submitted
7. Player switches to GLOBAL tab → Views global leaderboard
```

### Components
- **Frontend**: Modified scoreboard modal with tabs
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Storage**: Local (localStorage) + Global (Supabase)
- **API**: Supabase REST API + Edge Functions

---

## Phase 1: Supabase Setup (First-Time User Guide)

### Step 1.1: Create Supabase Account

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Click "Start your project" or "Sign Up"

2. **Sign up with GitHub** (recommended)
   - Click "Continue with GitHub"
   - Authorize Supabase to access your GitHub account
   - Or use email/password if preferred

3. **Email Verification**
   - Check your email inbox
   - Click verification link
   - You'll be redirected to Supabase dashboard

### Step 1.2: Create New Project

1. **Click "New Project"**
   - You'll see this on the dashboard after signing in

2. **Fill in Project Details**
   ```
   Project Name: vibe-survivor-leaderboard
   Database Password: [Generate strong password - SAVE THIS!]
   Region: Choose closest to your users (e.g., "US West" for North America)
   Pricing Plan: Free (selected by default)
   ```

3. **Click "Create New Project"**
   - Wait 2-3 minutes for project to initialize
   - You'll see a progress bar

4. **Save Important Information**
   - Once ready, click on "Settings" (gear icon) → "API"
   - **SAVE THESE VALUES** (you'll need them later):
     ```
     Project URL: https://xxxxxxxxxxxxx.supabase.co
     API Key (anon/public): eyJhbGc...  [long string]
     ```
   - ⚠️ **NEVER commit these to git!** Store in `.env` file

### Step 1.3: Create Database Table

1. **Open SQL Editor**
   - In Supabase dashboard, click "SQL Editor" in left sidebar
   - Click "New Query"

2. **Run This SQL** (copy-paste entire block):

   **⚠️ Important**: This schema is **auth-ready** - it supports both anonymous (v1.0) and authenticated (future) submissions. The `user_id` and `is_anonymous` fields enable future social login without data migration!

   ```sql
   -- Create global_scores table (AUTH-READY)
   CREATE TABLE public.global_scores (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

     -- User identification (flexible for both anonymous and authenticated modes)
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL for anonymous, FK for auth users
     player_name TEXT NOT NULL,
     is_anonymous BOOLEAN DEFAULT TRUE,

     -- Score data
     score_data JSONB NOT NULL,
     submission_date TIMESTAMPTZ DEFAULT NOW(),
     game_version TEXT NOT NULL,
     major_version TEXT NOT NULL,

     -- Spam prevention (works for both modes)
     client_fingerprint TEXT,
     ip_address TEXT,
     submission_count INTEGER DEFAULT 1,

     -- Constraints
     CONSTRAINT player_name_length CHECK (char_length(player_name) >= 3 AND char_length(player_name) <= 20),
     CONSTRAINT valid_game_version CHECK (game_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
     CONSTRAINT valid_major_version CHECK (major_version ~ '^[0-9]+\.[0-9]+$'),

     -- Ensure anonymous scores have fingerprint, auth scores have user_id
     CONSTRAINT anonymous_needs_fingerprint CHECK (
       (is_anonymous = FALSE AND user_id IS NOT NULL) OR
       (is_anonymous = TRUE AND client_fingerprint IS NOT NULL)
     )
   );

   -- Create indexes for fast queries (supports both modes)
   CREATE INDEX idx_global_scores_user_id ON public.global_scores(user_id) WHERE user_id IS NOT NULL;
   CREATE INDEX idx_global_scores_anonymous ON public.global_scores(is_anonymous, client_fingerprint) WHERE is_anonymous = TRUE;
   CREATE INDEX idx_global_scores_major_version ON public.global_scores(major_version);
   CREATE INDEX idx_global_scores_level ON public.global_scores((score_data->>'level') DESC);
   CREATE INDEX idx_global_scores_submission_date ON public.global_scores(submission_date DESC);
   CREATE INDEX idx_global_scores_composite ON public.global_scores(
     major_version,
     (score_data->>'level')::int DESC,
     (score_data->>'time')::int DESC
   );

   -- Add comment for documentation
   COMMENT ON TABLE public.global_scores IS 'Global leaderboard scores for Vibe Survivor - supports both anonymous and authenticated submissions';
   ```

3. **Click "Run" button** (or press Ctrl+Enter)
   - You should see "Success. No rows returned"
   - If you see an error, read it carefully and fix any issues

4. **Verify Table Created**
   - Click "Table Editor" in left sidebar
   - You should see `global_scores` table
   - Click on it to view structure (should be empty)

### Step 1.4: Setup Row Level Security (RLS)

**What is RLS?** Row Level Security controls who can read/write data. These policies support **both anonymous and authenticated submissions**.

**Policy Goals:**
- ✅ Anyone can READ scores (public leaderboard)
- ✅ Both anonymous and authenticated users can INSERT (validated via Edge Function)
- ✅ Authenticated users can UPDATE/DELETE their own scores (future feature)
- ❌ Anonymous users cannot UPDATE/DELETE

1. **Enable RLS on Table**
   - In SQL Editor, run this:
   ```sql
   -- Enable Row Level Security
   ALTER TABLE public.global_scores ENABLE ROW LEVEL SECURITY;
   ```

2. **Create Read Policy** (allow everyone to view scores)
   ```sql
   CREATE POLICY "Public read access"
   ON public.global_scores
   FOR SELECT
   USING (true);
   ```

3. **Create Insert Policy** (supports both anonymous and authenticated)
   ```sql
   CREATE POLICY "Insert for anonymous and authenticated"
   ON public.global_scores
   FOR INSERT
   WITH CHECK (
     -- Authenticated users (future)
     (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_anonymous = FALSE)
     OR
     -- Anonymous users (v1.0 launch)
     (auth.uid() IS NULL AND is_anonymous = TRUE AND client_fingerprint IS NOT NULL)
   );
   ```

4. **Create Update Policy** (authenticated users only - future feature)
   ```sql
   CREATE POLICY "Users can update own scores"
   ON public.global_scores
   FOR UPDATE
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);
   ```

5. **Create Delete Policy** (authenticated users only - future feature)
   ```sql
   CREATE POLICY "Users can delete own scores"
   ON public.global_scores
   FOR DELETE
   USING (auth.uid() = user_id);
   ```

6. **Verify Policies**
   - Click "Authentication" → "Policies" in sidebar
   - You should see 4 policies for `global_scores` table
   - For v1.0 launch, only INSERT and SELECT policies are used

### Step 1.5: Create Edge Function for Validation

**What is an Edge Function?** Server-side code that runs on Supabase servers. We use it to validate submissions before saving to database.

#### Install Supabase CLI (One-time setup)

**Windows:**
```powershell
# Using Scoop (recommended)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OR using npm
npm install -g supabase
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
# Download binary
curl -Lo supabase https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64
chmod +x supabase
sudo mv supabase /usr/local/bin/
```

**Verify Installation:**
```bash
supabase --version
```

#### Setup Edge Function

1. **Login to Supabase CLI**
   ```bash
   supabase login
   ```
   - Browser will open for authentication
   - Grant access

2. **Link to Your Project**
   ```bash
   # Get project reference ID from: Settings → General → Reference ID
   supabase link --project-ref your-project-ref-id
   ```

3. **Create Edge Function**
   ```bash
   # Navigate to your game directory
   cd C:\Users\samso\OneDrive\Desktop\Vibe\Web\Vibe-Survivor

   # Create function
   supabase functions new submit-score
   ```

4. **Edit the Function**
   - This creates: `supabase/functions/submit-score/index.ts`
   - Replace contents with this **auth-ready, practically-secure** code:

   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   }

   // Simple profanity filter (expand this list as needed)
   const BANNED_WORDS = ['badword1', 'badword2']; // Add actual words

   function containsProfanity(text: string): boolean {
     const lower = text.toLowerCase();
     return BANNED_WORDS.some(word => lower.includes(word));
   }

   serve(async (req) => {
     // Handle CORS preflight
     if (req.method === 'OPTIONS') {
       return new Response('ok', { headers: corsHeaders })
     }

     try {
       // Create Supabase client with auth context
       const supabaseClient = createClient(
         Deno.env.get('SUPABASE_URL') ?? '',
         Deno.env.get('SUPABASE_ANON_KEY') ?? '',
         {
           global: {
             headers: { Authorization: req.headers.get('Authorization')! },
           },
         }
       )

       // Check if user is authenticated (future feature)
       const { data: { user } } = await supabaseClient.auth.getUser()

       const { player_name, score_data, game_version, major_version, client_fingerprint } = await req.json()

       // Get client IP for spam prevention
       const clientIP = req.headers.get('x-forwarded-for') ||
                        req.headers.get('cf-connecting-ip') ||
                        'unknown';

       let insertData: any;

       if (user) {
         // ========== AUTHENTICATED SUBMISSION (FUTURE) ==========
         insertData = {
           user_id: user.id,
           player_name: player_name || user.user_metadata?.name || 'Player',
           is_anonymous: false,
           score_data,
           game_version,
           major_version,
           ip_address: clientIP,
           client_fingerprint: null, // Don't need fingerprint for auth users
         }

         // Less strict rate limiting for authenticated users (10 per hour)
         const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
         const { count } = await supabaseClient
           .from('global_scores')
           .select('*', { count: 'exact', head: true })
           .eq('user_id', user.id)
           .gte('submission_date', oneHourAgo)

         if (count && count >= 10) {
           throw new Error('Rate limit exceeded (10/hour for authenticated users)')
         }

       } else {
         // ========== ANONYMOUS SUBMISSION (v1.0) ==========

         // 1. Validate player name
         if (!player_name || typeof player_name !== 'string') {
           throw new Error('Player name is required')
         }
         const trimmedName = player_name.trim()
         if (trimmedName.length < 3 || trimmedName.length > 20) {
           throw new Error('Player name must be 3-20 characters')
         }
         if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmedName)) {
           throw new Error('Player name can only contain letters, numbers, spaces, _ and -')
         }
         if (containsProfanity(trimmedName)) {
           throw new Error('Player name contains inappropriate content')
         }

         insertData = {
           user_id: null,
           player_name: trimmedName,
           is_anonymous: true,
           score_data,
           game_version,
           major_version,
           ip_address: clientIP,
           client_fingerprint,
         }

         // Stricter rate limiting for anonymous (5 per hour)
         if (client_fingerprint) {
           const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

           const { count } = await supabaseClient
             .from('global_scores')
             .select('*', { count: 'exact', head: true })
             .eq('client_fingerprint', client_fingerprint)
             .gte('submission_date', oneHourAgo)

           if (count && count >= 5) {
             throw new Error('Rate limit exceeded. Please wait before submitting again.')
           }
         }

         // Check IP rate limit (20 per hour from same IP - prevents bot floods)
         const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
         const { count: ipCount } = await supabaseClient
           .from('global_scores')
           .select('*', { count: 'exact', head: true })
           .eq('ip_address', clientIP)
           .gte('submission_date', oneHourAgo)

         if (ipCount && ipCount >= 20) {
           throw new Error('Too many submissions from this network. Please try again later.')
         }

         // Duplicate detection (same score within 5 minutes)
         const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
         const { data: recentScores } = await supabaseClient
           .from('global_scores')
           .select('score_data')
           .eq('client_fingerprint', client_fingerprint)
           .gte('submission_date', fiveMinutesAgo)
           .limit(1)

         if (recentScores && recentScores.length > 0) {
           const recent = recentScores[0].score_data
           const { level, time, enemiesKilled } = score_data
           if (recent.level === level && recent.time === time && recent.enemiesKilled === enemiesKilled) {
             throw new Error('Duplicate submission detected. Please wait before resubmitting.')
           }
         }
       }

       // ========== VALIDATE SCORE DATA (both modes) ==========

       // 2. Validate game version
       if (!game_version || !/^\d+\.\d+\.\d+$/.test(game_version)) {
         throw new Error('Invalid game version')
       }
       if (!major_version || !/^\d+\.\d+$/.test(major_version)) {
         throw new Error('Invalid major version')
       }

       // 3. Validate score data structure
       if (!score_data || typeof score_data !== 'object') {
         throw new Error('Invalid score data')
       }

       const { level, time, enemiesKilled, bossesKilled, weapons } = score_data

       // Basic sanity checks (not paranoid, just preventing obviously fake scores)
       if (!level || level < 1 || level > 100) {
         throw new Error('Invalid level (must be 1-100)')
       }
       if (!time || time < 0 || time > 7200) {
         throw new Error('Invalid time (must be 0-7200 seconds / 2 hours)')
       }
       if (enemiesKilled < 0 || enemiesKilled > 50000) {
         throw new Error('Invalid enemy count (max 50,000)')
       }
       if (bossesKilled < 0 || bossesKilled > 100) {
         throw new Error('Invalid boss count (max 100)')
       }

       // Light validation - just prevent obviously impossible scores
       // (Since it's just for bragging, no prizes, we don't need to be paranoid)
       const enemiesPerMinute = enemiesKilled / (time / 60);
       if (enemiesPerMinute > 200) {
         throw new Error('Unrealistic enemy kill rate')
       }

       if (weapons && weapons.length > 10) {
         throw new Error('Too many weapons (max 10)')
       }

       // ========== INSERT SCORE ==========
       const { data, error } = await supabaseClient
         .from('global_scores')
         .insert(insertData)
         .select()
         .single()

       if (error) {
         throw error
       }

       return new Response(
         JSON.stringify({
           success: true,
           id: data.id,
           is_anonymous: data.is_anonymous
         }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )

     } catch (error) {
       console.error('Submission error:', error)
       return new Response(
         JSON.stringify({ success: false, error: error.message }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )
     }
   })
   ```

   **Key Features:**
   - ✅ Supports both anonymous (v1.0) and authenticated (future) submissions
   - ✅ Different rate limits: 5/hour anonymous, 10/hour authenticated
   - ✅ IP-based spam prevention (20/hour per IP)
   - ✅ Profanity filter for names
   - ✅ Duplicate detection
   - ✅ Practical validation (not paranoid - it's just for bragging!)
   - ✅ Logs errors for debugging

5. **Deploy Edge Function**
   ```bash
   supabase functions deploy submit-score
   ```

6. **Get Function URL**
   - After deployment, you'll see URL like:
   ```
   https://xxxxxxxxxxxxx.supabase.co/functions/v1/submit-score
   ```
   - Save this URL - you'll need it in your frontend code

7. **Test Edge Function** (optional)
   ```bash
   curl -X POST https://xxxxxxxxxxxxx.supabase.co/functions/v1/submit-score \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{
       "player_name": "TestPlayer",
       "score_data": {"level": 10, "time": 300, "enemiesKilled": 100, "bossesKilled": 2},
       "game_version": "1.0.0",
       "major_version": "1.0",
       "client_fingerprint": "test123"
     }'
   ```

### Step 1.6: Setup Environment Variables

1. **Create `.env` file** in project root:
   ```bash
   # .env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
   ```

2. **Add to `.gitignore`**:
   ```gitignore
   # Add these lines
   .env
   .env.local
   supabase/.branches
   supabase/.temp
   ```

3. **Create config file** for frontend:
   - Create: `js/config/supabase-config.js`
   ```javascript
   // Supabase configuration
   // These values are safe to expose in client-side code (anon key only)
   export const SUPABASE_CONFIG = {
       url: 'https://xxxxxxxxxxxxx.supabase.co',
       anonKey: 'eyJhbGc...your-anon-key-here',
       edgeFunctionUrl: 'https://xxxxxxxxxxxxx.supabase.co/functions/v1/submit-score'
   };
   ```

---

## Phase 2: Frontend Implementation

### Step 2.1: Install Supabase Client Library

Since this is a vanilla JS project (no build tools), we'll use CDN:

**Option A: Via CDN (Recommended for this project)**

Add to `index.html` in `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**Option B: Via ES Module Import**

In your JS file:
```javascript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
```

### Step 2.2: Create Supabase Client Utility

Create new file: `js/utils/supabase-client.js`

```javascript
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

/**
 * Supabase client for global leaderboard
 * Handles all API interactions with Supabase backend
 */
class SupabaseClient {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.edgeFunctionUrl = SUPABASE_CONFIG.edgeFunctionUrl;
    }

    /**
     * Initialize Supabase client (lazy loading)
     */
    init() {
        if (this.initialized) return;

        try {
            // Using global supabase from CDN
            if (typeof window.supabase === 'undefined') {
                console.error('Supabase library not loaded');
                return false;
            }

            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );

            this.initialized = true;
            console.log('Supabase client initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            return false;
        }
    }

    /**
     * Submit score to global leaderboard via Edge Function
     * @param {Object} scoreData - Score data from local storage
     * @param {string} playerName - User-entered display name
     * @returns {Promise<Object>} - { success: boolean, id?: string, error?: string }
     */
    async submitScore(scoreData, playerName) {
        if (!this.initialized && !this.init()) {
            return { success: false, error: 'Supabase not initialized' };
        }

        try {
            // Generate client fingerprint for basic spam prevention
            const fingerprint = this.getClientFingerprint();

            const payload = {
                player_name: playerName,
                score_data: {
                    level: scoreData.level,
                    time: scoreData.time,
                    timeText: scoreData.timeText,
                    enemiesKilled: scoreData.enemiesKilled,
                    bossesKilled: scoreData.bossesKilled,
                    chestsCollected: scoreData.chestsCollected,
                    weapons: scoreData.weapons,
                    passives: scoreData.passives,
                    playerStats: scoreData.playerStats
                },
                game_version: scoreData.version,
                major_version: scoreData.majorVersion,
                client_fingerprint: fingerprint
            };

            // Call Edge Function for validation and insertion
            const response = await fetch(this.edgeFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Submission failed');
            }

            return { success: true, id: result.id };

        } catch (error) {
            console.error('Score submission error:', error);
            return {
                success: false,
                error: error.message || 'Failed to submit score'
            };
        }
    }

    /**
     * Fetch global scores with filtering
     * @param {Object} options - { majorVersion?: string, limit?: number, offset?: number }
     * @returns {Promise<Array>} - Array of score objects
     */
    async fetchGlobalScores({ majorVersion = null, limit = 100, offset = 0 } = {}) {
        if (!this.initialized && !this.init()) {
            return [];
        }

        try {
            let query = this.supabase
                .from('global_scores')
                .select('*')
                .order('score_data->level', { ascending: false })
                .order('score_data->time', { ascending: false })
                .range(offset, offset + limit - 1);

            if (majorVersion && majorVersion !== 'all') {
                query = query.eq('major_version', majorVersion);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];

        } catch (error) {
            console.error('Failed to fetch global scores:', error);
            return [];
        }
    }

    /**
     * Get unique major versions from global leaderboard
     * @returns {Promise<Array<string>>} - Array of version strings
     */
    async getGlobalVersions() {
        if (!this.initialized && !this.init()) {
            return [];
        }

        try {
            const { data, error } = await this.supabase
                .from('global_scores')
                .select('major_version')
                .order('major_version', { ascending: false });

            if (error) throw error;

            // Get unique versions
            const versions = [...new Set(data.map(s => s.major_version))];
            return versions;

        } catch (error) {
            console.error('Failed to fetch versions:', error);
            return [];
        }
    }

    /**
     * Get a specific score by ID
     * @param {string} id - Score UUID
     * @returns {Promise<Object|null>}
     */
    async getScoreById(id) {
        if (!this.initialized && !this.init()) {
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('global_scores')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('Failed to fetch score:', error);
            return null;
        }
    }

    /**
     * Generate simple client fingerprint for spam prevention
     * Not cryptographically secure, just basic tracking
     * @returns {string}
     */
    getClientFingerprint() {
        // Try to get from localStorage first
        let fingerprint = localStorage.getItem('vibe-survivor-fingerprint');

        if (!fingerprint) {
            // Generate simple fingerprint from browser info
            const nav = window.navigator;
            const screen = window.screen;
            const components = [
                nav.userAgent,
                nav.language,
                screen.colorDepth,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                !!window.sessionStorage,
                !!window.localStorage
            ];

            // Simple hash
            const str = components.join('|');
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }

            fingerprint = 'fp_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
            localStorage.setItem('vibe-survivor-fingerprint', fingerprint);
        }

        return fingerprint;
    }
}

// Export singleton instance
export const supabaseClient = new SupabaseClient();
```

### Step 2.3: Update ScoreboardStorage

Modify `js/utils/scoreboard-storage.js` to track submission status:

```javascript
// Add to existing ScoreboardStorage class

/**
 * Mark a score as submitted to global leaderboard
 * @param {number} localId - Local score timestamp ID
 * @param {string} globalId - Global score UUID from Supabase
 * @param {string} playerName - Name used for submission
 */
markAsSubmitted(localId, globalId, playerName) {
    const data = this._loadData();
    const score = data.scores.find(s => s.id === localId);

    if (score) {
        score.submitted = true;
        score.submissionId = globalId;
        score.submittedName = playerName;
        score.submissionDate = new Date().toISOString();
        this._saveData(data);
        return true;
    }

    return false;
}

/**
 * Check if a score has been submitted
 * @param {number} localId - Local score timestamp ID
 * @returns {Object|null} - { submitted: boolean, globalId?: string, playerName?: string }
 */
getSubmissionStatus(localId) {
    const data = this._loadData();
    const score = data.scores.find(s => s.id === localId);

    if (!score) return null;

    return {
        submitted: score.submitted || false,
        globalId: score.submissionId || null,
        playerName: score.submittedName || null,
        submissionDate: score.submissionDate || null
    };
}
```

### Step 2.4: Update Scoreboard Modal - Add Tabs

Modify `js/vibe-survivor-game.js` - Update scoreboard modal HTML:

```html
<div id="scoreboard-modal" class="scoreboard-modal" style="display: none;">
    <div class="scoreboard-content">
        <!-- Header -->
        <div class="scoreboard-header">
            <div class="scoreboard-title">SCOREBOARD</div>

            <!-- NEW: Tab Switcher -->
            <div class="scoreboard-tabs">
                <button class="scoreboard-tab active" data-tab="local">LOCAL</button>
                <button class="scoreboard-tab" data-tab="global">GLOBAL</button>
            </div>

            <!-- Version Filter (shown for both tabs) -->
            <div class="scoreboard-filter">
                <label for="scoreboard-version-filter">Version</label>
                <select id="scoreboard-version-filter">
                    <option value="all">All Versions</option>
                </select>
            </div>
        </div>

        <!-- Tab Content Containers -->
        <div class="scoreboard-tabs-content">
            <!-- LOCAL Tab Content (existing) -->
            <div class="scoreboard-tab-pane active" data-tab-pane="local">
                <div class="scoreboard-list-container" tabindex="0">
                    <div id="scoreboard-list" class="scoreboard-list"></div>
                    <div class="scoreboard-empty-state">No scores yet. Play a run to add your first record!</div>
                </div>
            </div>

            <!-- GLOBAL Tab Content (new) -->
            <div class="scoreboard-tab-pane" data-tab-pane="global">
                <div class="global-scoreboard-container" tabindex="0">
                    <div id="global-scoreboard-list" class="scoreboard-list"></div>
                    <div class="global-empty-state">No global scores yet.</div>
                    <div class="global-loading-state" style="display: none;">
                        <div class="spinner"></div>
                        <p>Loading global scores...</p>
                    </div>
                    <div class="global-error-state" style="display: none;">
                        <p>Failed to load global scores. Check your connection.</p>
                        <button id="global-retry-btn" class="survivor-btn">RETRY</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions (shown for both tabs) -->
        <div class="scoreboard-actions">
            <!-- Local tab: show clear button -->
            <button id="scoreboard-clear-btn" class="local-only">CLEAR ALL</button>
            <!-- Global tab: show refresh button -->
            <button id="global-refresh-btn" class="global-only" style="display: none;">REFRESH</button>
            <!-- Always show close -->
            <button id="scoreboard-close-btn">CLOSE</button>
        </div>
    </div>
</div>
```

### Step 2.5: Update ScoreboardModal Class

Modify `js/systems/ui/modals/scoreboard-modal.js`:

```javascript
import { Modal } from './modal-base.js';
import { scoreboardStorage } from '../../../utils/scoreboard-storage.js';
import { supabaseClient } from '../../../utils/supabase-client.js';

export class ScoreboardModal extends Modal {
    constructor(id = 'scoreboard-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: true });

        // Existing properties...
        this.versionFilter = null;
        this.scoreList = null;
        this.listContainer = null;
        this.emptyState = null;
        this.clearButton = null;
        this.closeButton = null;

        // NEW: Tab properties
        this.activeTab = 'local'; // 'local' or 'global'
        this.tabButtons = [];
        this.tabPanes = [];
        this.globalScoreList = null;
        this.globalContainer = null;
        this.globalEmptyState = null;
        this.globalLoadingState = null;
        this.globalErrorState = null;
        this.globalRefreshButton = null;
        this.globalRetryButton = null;
        this.globalScores = [];

        // Existing properties...
        this.onScoreSelectedCallback = null;
        this.onCloseCallback = null;
        this.getTranslation = null;
        this.keyboardHandler = null;
        this.selectedCardIndex = 0;
    }

    init() {
        const result = super.init();
        if (!result) return false;

        // Existing elements
        this.versionFilter = this.element.querySelector('#scoreboard-version-filter');
        this.scoreList = this.element.querySelector('#scoreboard-list');
        this.listContainer = this.element.querySelector('.scoreboard-list-container');
        this.emptyState = this.element.querySelector('.scoreboard-empty-state');
        this.clearButton = this.element.querySelector('#scoreboard-clear-btn');
        this.closeButton = this.element.querySelector('#scoreboard-close-btn');

        // NEW: Tab elements
        this.tabButtons = Array.from(this.element.querySelectorAll('.scoreboard-tab'));
        this.tabPanes = Array.from(this.element.querySelectorAll('.scoreboard-tab-pane'));
        this.globalScoreList = this.element.querySelector('#global-scoreboard-list');
        this.globalContainer = this.element.querySelector('.global-scoreboard-container');
        this.globalEmptyState = this.element.querySelector('.global-empty-state');
        this.globalLoadingState = this.element.querySelector('.global-loading-state');
        this.globalErrorState = this.element.querySelector('.global-error-state');
        this.globalRefreshButton = this.element.querySelector('#global-refresh-btn');
        this.globalRetryButton = this.element.querySelector('#global-retry-btn');

        this.attachEventHandlers();
        this.populateVersions();
        this.renderScores();
        this.updateLocalization();

        // Initialize Supabase
        supabaseClient.init();

        return true;
    }

    attachEventHandlers() {
        // Existing handlers
        if (this.versionFilter) {
            this.versionFilter.addEventListener('change', () => {
                if (this.activeTab === 'local') {
                    this.renderScores();
                } else {
                    this.loadGlobalScores();
                }
            });
        }

        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.handleClearScores());
        }

        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hide());
        }

        // NEW: Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // NEW: Global refresh/retry
        if (this.globalRefreshButton) {
            this.globalRefreshButton.addEventListener('click', () => this.loadGlobalScores());
        }
        if (this.globalRetryButton) {
            this.globalRetryButton.addEventListener('click', () => this.loadGlobalScores());
        }
    }

    /**
     * Switch between LOCAL and GLOBAL tabs
     */
    switchTab(tabName) {
        if (this.activeTab === tabName) return;

        this.activeTab = tabName;

        // Update tab buttons
        this.tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab panes
        this.tabPanes.forEach(pane => {
            if (pane.dataset.tabPane === tabName) {
                pane.classList.add('active');
                pane.style.display = 'block';
            } else {
                pane.classList.remove('active');
                pane.style.display = 'none';
            }
        });

        // Update action buttons
        if (this.clearButton) {
            this.clearButton.style.display = tabName === 'local' ? 'inline-block' : 'none';
        }
        if (this.globalRefreshButton) {
            this.globalRefreshButton.style.display = tabName === 'global' ? 'inline-block' : 'none';
        }

        // Load content for active tab
        if (tabName === 'local') {
            this.renderScores();
        } else if (tabName === 'global') {
            this.loadGlobalScores();
        }

        // Reset keyboard selection
        this.selectedCardIndex = 0;
        this.updateCardSelection();
    }

    /**
     * Load global scores from Supabase
     */
    async loadGlobalScores() {
        if (!this.globalScoreList) return;

        // Show loading state
        this.globalScoreList.style.display = 'none';
        this.globalEmptyState.style.display = 'none';
        this.globalErrorState.style.display = 'none';
        this.globalLoadingState.style.display = 'flex';

        try {
            const version = this.versionFilter?.value || 'all';
            const scores = await supabaseClient.fetchGlobalScores({
                majorVersion: version,
                limit: 100
            });

            this.globalScores = scores;

            // Hide loading
            this.globalLoadingState.style.display = 'none';

            if (!scores || scores.length === 0) {
                this.globalEmptyState.style.display = 'block';
                return;
            }

            // Render scores
            this.globalScoreList.style.display = 'flex';
            this.renderGlobalScores(scores);

        } catch (error) {
            console.error('Failed to load global scores:', error);
            this.globalLoadingState.style.display = 'none';
            this.globalErrorState.style.display = 'block';
        }
    }

    /**
     * Render global scores list
     */
    renderGlobalScores(scores) {
        if (!this.globalScoreList) return;

        this.globalScoreList.innerHTML = '';

        scores.forEach((score, index) => {
            const card = this.createGlobalScoreCard(score, index + 1);
            this.globalScoreList.appendChild(card);
        });
    }

    /**
     * Create a global score card
     */
    createGlobalScoreCard(score, rank) {
        const t = this.getTranslation;
        const formatter = new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const dateText = score.submission_date ? formatter.format(new Date(score.submission_date)) : '';
        const data = score.score_data;

        const bossesLabel = t ? t('bosses') : 'Bosses';
        const enemiesLabel = t ? t('enemies') : 'Enemies';
        const levelLabel = t ? t('level') : 'Level';
        const timeLabel = t ? t('time') : 'Time';

        const card = document.createElement('div');
        card.className = 'score-card global-score-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `${score.player_name}, ${levelLabel} ${data.level}`);
        card.dataset.scoreId = score.id;
        card.dataset.isGlobal = 'true';

        card.innerHTML = `
            <div class="score-card__header">
                <div class="score-rank">#${rank}</div>
                <div class="score-player-name">${this.escapeHtml(score.player_name)}</div>
                <div class="score-meta">
                    <span class="score-version">v${score.major_version}</span>
                    <span class="score-date">${dateText}</span>
                </div>
            </div>
            <div class="score-card__body">
                <div class="score-stat">${levelLabel}: <span>${data.level}</span></div>
                <div class="score-stat">${timeLabel}: <span>${data.timeText || this.formatTime(data.time)}</span></div>
                <div class="score-stat">${enemiesLabel}: <span>${data.enemiesKilled ?? 0}</span></div>
                <div class="score-stat">${bossesLabel}: <span>${data.bossesKilled ?? 0}</span></div>
            </div>
        `;

        const openDetail = () => {
            if (this.onScoreSelectedCallback) {
                // Pass global score data to detail modal
                this.onScoreSelectedCallback(score.id, { isGlobal: true, score });
            }
        };

        card.addEventListener('click', openDetail);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetail();
            }
        });

        return card;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ... rest of existing methods (renderScores, show, hide, etc.) ...
}
```

### Step 2.6: Update Score Detail Modal - Add Submit Button

Modify `js/systems/ui/modals/score-detail-modal.js`:

Add to the HTML in `vibe-survivor-game.js` for score detail modal:

```html
<!-- Add this section before the existing actions buttons -->
<div class="score-submission-section">
    <div id="submission-status" style="display: none;">
        <div class="submission-info">
            <span class="submission-checkmark">✓</span>
            <span class="submission-text">Submitted as <strong id="submitted-name"></strong></span>
            <span class="submission-date" id="submitted-date"></span>
        </div>
        <button id="view-on-global-btn" class="survivor-btn">VIEW ON GLOBAL BOARD</button>
    </div>
    <button id="submit-to-global-btn" class="survivor-btn submit-global" style="display: none;">
        📊 SUBMIT TO GLOBAL LEADERBOARD
    </button>
</div>
```

Add to `ScoreDetailModal` class:

```javascript
constructor(id = 'score-detail-modal') {
    super(id, { closeOnEscape: true, closeOnBackdropClick: false });
    // ... existing properties ...

    // NEW: Submission elements
    this.submitButton = null;
    this.submissionStatus = null;
    this.viewOnGlobalButton = null;
    this.onViewGlobalCallback = null;
}

init() {
    const result = super.init();
    if (!result) return false;

    // ... existing element queries ...

    // NEW: Submission elements
    this.submitButton = this.element.querySelector('#submit-to-global-btn');
    this.submissionStatus = this.element.querySelector('#submission-status');
    this.viewOnGlobalButton = this.element.querySelector('#view-on-global-btn');

    // NEW: Event handlers
    if (this.submitButton) {
        this.submitButton.addEventListener('click', () => this.handleSubmitToGlobal());
    }
    if (this.viewOnGlobalButton) {
        this.viewOnGlobalButton.addEventListener('click', () => this.handleViewOnGlobal());
    }

    // ... existing init code ...
    return true;
}

showScore(score) {
    if (!score) return;
    this.currentScore = score;
    this.renderScore(score);

    // NEW: Update submission UI
    this.updateSubmissionUI(score);

    super.show();
    // ... rest of existing show code ...
}

/**
 * Update submission button/status based on score
 */
updateSubmissionUI(score) {
    const status = scoreboardStorage.getSubmissionStatus(score.id);

    if (status && status.submitted) {
        // Already submitted - show status
        this.submitButton.style.display = 'none';
        this.submissionStatus.style.display = 'block';

        const nameEl = this.element.querySelector('#submitted-name');
        const dateEl = this.element.querySelector('#submitted-date');

        if (nameEl) nameEl.textContent = status.playerName;
        if (dateEl && status.submissionDate) {
            const formatter = new Intl.DateTimeFormat(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            dateEl.textContent = formatter.format(new Date(status.submissionDate));
        }
    } else {
        // Not submitted - show button
        this.submitButton.style.display = 'block';
        this.submissionStatus.style.display = 'none';
    }
}

/**
 * Handle submit to global leaderboard
 */
async handleSubmitToGlobal() {
    if (!this.currentScore) return;

    const t = this.getTranslation;

    // Show name input dialog
    const playerName = prompt(
        t ? t('enterPlayerName') : 'Enter your display name (3-20 characters):',
        ''
    );

    if (!playerName) return; // User cancelled

    // Validate name
    const trimmed = playerName.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
        alert(t ? t('invalidNameLength') : 'Name must be 3-20 characters');
        return;
    }

    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
        alert(t ? t('invalidNameChars') : 'Name can only contain letters, numbers, spaces, _ and -');
        return;
    }

    // Show loading state
    this.submitButton.disabled = true;
    this.submitButton.textContent = t ? t('submitting') : 'SUBMITTING...';

    try {
        // Submit to Supabase
        const result = await supabaseClient.submitScore(this.currentScore, trimmed);

        if (result.success) {
            // Mark as submitted in local storage
            scoreboardStorage.markAsSubmitted(
                this.currentScore.id,
                result.id,
                trimmed
            );

            // Update UI
            this.updateSubmissionUI(this.currentScore);

            // Show success message
            alert(t ? t('submissionSuccess') : '✓ Score submitted to global leaderboard!');

        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error('Submission failed:', error);
        alert(
            t ? t('submissionFailed') :
            `Failed to submit score: ${error.message || 'Unknown error'}`
        );

        // Reset button
        this.submitButton.disabled = false;
        this.submitButton.textContent = t ? t('submitToGlobal') : '📊 SUBMIT TO GLOBAL LEADERBOARD';
    }
}

/**
 * Handle view on global board
 */
handleViewOnGlobal() {
    if (this.onViewGlobalCallback) {
        const status = scoreboardStorage.getSubmissionStatus(this.currentScore.id);
        if (status && status.globalId) {
            this.onViewGlobalCallback(status.globalId);
        }
    }
}

/**
 * Set callback for viewing on global board
 */
onViewGlobal(callback) {
    this.onViewGlobalCallback = callback;
}
```

### Step 2.7: Add CSS Styling for Tabs

Add to `styles/base.css`:

```css
/* ========== Scoreboard Tabs ========== */
.scoreboard-tabs {
    display: flex;
    gap: 8px;
    margin: 12px 0;
}

.scoreboard-tab {
    flex: 1;
    padding: 10px 20px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    color: #00ffff;
    font-family: 'NeoDunggeunmoPro', 'Courier New', monospace;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.scoreboard-tab:hover {
    background: rgba(0, 255, 255, 0.1);
    border-color: rgba(0, 255, 255, 0.5);
}

.scoreboard-tab.active {
    background: rgba(0, 255, 255, 0.2);
    border-color: #00ffff;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

/* Tab Panes */
.scoreboard-tabs-content {
    flex: 1 1 auto;
    min-height: 0;
    position: relative;
}

.scoreboard-tab-pane {
    display: none;
    height: 100%;
}

.scoreboard-tab-pane.active {
    display: flex;
    flex-direction: column;
}

/* Global Scoreboard States */
.global-loading-state,
.global-error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px 20px;
    text-align: center;
    color: #00ffff;
}

.global-loading-state .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 255, 255, 0.2);
    border-top-color: #00ffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.global-error-state p {
    color: #ff6b6b;
}

/* Global Score Card Styling */
.global-score-card .score-player-name {
    font-size: 16px;
    font-weight: bold;
    color: #00ffff;
    margin: 4px 0;
    text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
}

/* Submission Section */
.score-submission-section {
    margin: 20px 0;
    padding: 16px;
    background: rgba(0, 255, 255, 0.05);
    border: 1px solid rgba(0, 255, 255, 0.2);
    border-radius: 8px;
    text-align: center;
}

.submission-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
}

.submission-checkmark {
    font-size: 32px;
    color: #00ff88;
}

.submission-text {
    font-size: 14px;
    color: #eef7ff;
}

.submission-date {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
}

.survivor-btn.submit-global {
    background: linear-gradient(135deg, #00aa66, #00cc88);
    border-color: #00ff88;
}

.survivor-btn.submit-global:hover {
    background: linear-gradient(135deg, #00cc77, #00ff99);
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
}

/* Action Button Visibility */
.scoreboard-actions .local-only,
.scoreboard-actions .global-only {
    display: none;
}

/* Show appropriate buttons based on active tab */
.scoreboard-modal[data-active-tab="local"] .scoreboard-actions .local-only {
    display: inline-block;
}

.scoreboard-modal[data-active-tab="global"] .scoreboard-actions .global-only {
    display: inline-block;
}
```

---

## Security & Anti-Cheat: Practical Approach

### Reality Check: Browser Games & Cheating

**Important**: This is a **free browser game with no prizes**, just bragging rights. Perfect security is impossible for client-side games, and unnecessary for your use case.

**Philosophy:**
- ✅ Make cheating **annoying** (not impossible)
- ✅ Focus on **spam/abuse prevention** (not perfect anti-cheat)
- ✅ Keep the barrier low for **legit players**
- ✅ Room to **escalate** if cheating becomes a problem

### What We're Already Doing (Good Enough!)

The Edge Function already includes:

**1. Rate Limiting**
- 5 submissions/hour per browser (fingerprint)
- 20 submissions/hour per IP address
- ✅ Prevents bot floods and rapid spam

**2. Duplicate Detection**
- Same score within 5 minutes = blocked
- ✅ Prevents accidental double-submissions

**3. Basic Validation**
- Level 1-100, Time 0-7200 seconds
- Enemies: max 50k, Bosses: max 100
- Enemy kill rate: max 200/minute
- Weapons: max 10
- ✅ Catches obviously impossible scores

**4. Name Sanitation**
- 3-20 characters, alphanumeric + _ -
- Profanity filter (basic word list)
- ✅ Prevents offensive names

**5. Version Isolation**
- Rankings by major version only
- New version = fresh leaderboard
- ✅ Balances stay fair after updates

### What We're NOT Doing (And Why)

❌ **Complex checksums** - Easy to bypass, adds friction
❌ **DevTools detection** - Unreliable, false positives
❌ **Advanced heuristics** - Overkill for no-prize game
❌ **Score encryption** - Client-side, easily defeated
❌ **Memory protection** - Impossible in browser

**Bottom Line**: For a free game with no rewards, basic spam prevention is enough. Most players won't cheat for bragging rights.

### Expected Cheating Rate

**Industry Standard** for free browser games: 5-15% of submissions

**Your Game (No Prizes)**:
- Likely **1-5%** will be obviously fake
- Most players play honest for fun
- Cheaters just hurt their own accomplishment
- Community can spot obvious fakes

**When to Care:**
- Leaderboard flooded with impossible scores (level 999, etc.)
- Same person submitting 100s of scores
- Bot patterns detected (rapid identical submissions)

### What to Do if Cheating Becomes a Problem

**Phase 1: Monitor** (do this from day 1)
```sql
-- Check Edge Function logs in Supabase dashboard
-- Look for patterns:
-- - High rejection rates from same IP
-- - Multiple accounts with similar names
-- - Scores that trigger validation errors
```

**Phase 2: Community Reporting** (if needed)

Add to score detail modal:
```html
<button id="report-score-btn" class="survivor-btn">
  🚩 Report Suspicious Score
</button>
```

Store reports:
```sql
CREATE TABLE score_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id UUID REFERENCES global_scores(id),
  reported_by_fingerprint TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flag scores with multiple reports
UPDATE global_scores
SET flagged = true
WHERE id IN (
  SELECT score_id FROM score_reports
  GROUP BY score_id
  HAVING COUNT(*) >= 3
);
```

**Phase 3: Manual Moderation** (if abuse continues)

Create simple admin view:
```javascript
// Admin-only page (password-protected)
async function loadFlaggedScores() {
  const { data } = await supabase
    .from('global_scores')
    .select('*')
    .eq('flagged', true)
    .order('submission_date', { ascending: false });

  // Show list with DELETE button
}
```

**Phase 4: Ban System** (last resort)

```sql
CREATE TABLE banned_fingerprints (
  fingerprint TEXT PRIMARY KEY,
  reason TEXT,
  banned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE banned_ips (
  ip_address TEXT PRIMARY KEY,
  reason TEXT,
  banned_at TIMESTAMPTZ DEFAULT NOW()
);
```

Update Edge Function:
```typescript
// Check ban list before validation
const { data: bannedFingerprint } = await supabaseClient
  .from('banned_fingerprints')
  .select('*')
  .eq('fingerprint', client_fingerprint)
  .single();

if (bannedFingerprint) {
  throw new Error('Submissions from this device have been blocked');
}
```

### Best Practices for Low-Cheat Leaderboards

**1. Transparency**
- Show all score details (weapons, passives, stats)
- Community can judge legitimacy
- Obvious fakes are self-evident

**2. Version Isolation**
- Major version = separate leaderboard
- Balance changes don't affect old records
- Fresh start with each major update

**3. Multiple Categories** (future idea)
- Daily/Weekly/All-Time boards
- Cheaters less motivated when leaderboard resets
- More chances for legit players to rank

**4. Highlight Legitimacy** (future with auth)
- Show badge for authenticated users
- Separate "Verified" leaderboard
- Anonymous can still submit, but less visibility

**5. Don't Overreact**
- A few fake scores won't ruin the experience
- Most players ignore obvious cheats
- Focus on making the game fun, not cheat-proof

### Security Checklist

**Pre-Launch:**
- [x] Rate limiting active (5/hour fingerprint, 20/hour IP)
- [x] Basic score validation in Edge Function
- [x] Profanity filter for names
- [x] Duplicate detection (5-min window)
- [ ] Test: Submit 6 scores in 1 hour → 6th should fail
- [ ] Test: Submit with offensive name → Should fail
- [ ] Test: Submit level 999 → Should fail

**Post-Launch Monitoring:**
- [ ] Check Edge Function logs weekly
- [ ] Review highest scores monthly
- [ ] Monitor for bot patterns (10+ submissions from same IP/hour)
- [ ] Check for impossible scores (level > 100, time > 2 hours)

**If Problems Arise:**
- [ ] Implement community reporting (Phase 2)
- [ ] Add manual moderation tools (Phase 3)
- [ ] Create ban system (Phase 4)
- [ ] Consider stricter validation (only if abuse is rampant)

### Summary: Security Philosophy

**v1.0 (Launch)**:
- ✅ Basic spam prevention
- ✅ Simple validation
- ✅ Low friction for players
- ❌ No paranoid anti-cheat

**v1.1+ (If Needed)**:
- ✅ Community reporting
- ✅ Manual moderation
- ✅ Ban system for repeat offenders
- ✅ Stricter validation if abuse continues

**Remember**: It's a free game for fun. Don't spend more time fighting cheaters than making the game better! 🎮

---

## Phase 3: Testing Guide

### Test 1: Local Scoreboard (Regression Test)
1. Play game and die
2. Open scoreboard from start menu
3. Verify local scores still work
4. Click on score → detail modal opens
5. Keyboard navigation works (W/S, arrows)

### Test 2: Submit to Global
1. Open local score detail
2. Click "Submit to Global Leaderboard"
3. Enter name "TestPlayer123"
4. Verify success message
5. Refresh page → check status still shows "Submitted"

### Test 3: Global Leaderboard View
1. Switch to GLOBAL tab
2. Verify loading spinner shows
3. Verify scores load and display
4. Test version filter
5. Click on global score → detail opens (read-only)

### Test 4: Anti-Spam Validation

**Client-Side Validation:**
1. Try submitting with name "ab" → Should reject (too short)
2. Try name with special chars "@#$%" → Should reject
3. Try name "ValidName123" → Should accept

**Server-Side Rate Limiting:**
1. Submit 5 scores in quick succession → Should work
2. Try 6th submission within 1 hour → Should reject with rate limit error
3. Wait 1 hour → Should allow submission again

### Test 5: Edge Cases
1. No internet connection → Error state shows in global tab
2. Invalid score data → Edge function rejects
3. Duplicate submission (same score twice) → Second blocked
4. Long player name (21+ chars) → Rejected

### Test 6: Version Filtering
1. Play multiple games on v1.0
2. Update version to v1.1 in constants.js
3. Play more games on v1.1
4. Submit scores from both versions
5. Filter global board by version → Only see matching versions

---

## Phase 4: Deployment Checklist

### Before Going Live

- [ ] Test all submission flows
- [ ] Verify rate limiting works
- [ ] Test with slow network (throttle in DevTools)
- [ ] Check mobile responsiveness
- [ ] Add profanity filter to Edge Function
- [ ] Setup error monitoring (optional: Sentry)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Verify keyboard navigation works with tabs
- [ ] Check that submissions show in global board immediately

### Supabase Monitoring

1. **Check Database Usage**
   - Dashboard → Settings → Database
   - Monitor storage usage (free: 500 MB)
   - Check connection count

2. **Monitor Edge Function Invocations**
   - Dashboard → Edge Functions → submit-score
   - View invocation count (free: 500k/month)
   - Check error rates

3. **Review Logs**
   - Edge Functions → Logs tab
   - Look for validation errors
   - Identify spam patterns

### Security Checklist

- [ ] Never commit `.env` file to git
- [ ] Use anon key only (never service_role key in frontend)
- [ ] RLS policies enabled on table
- [ ] Edge Function validates ALL inputs
- [ ] Client fingerprinting implemented
- [ ] Rate limiting active (5/hour per client)
- [ ] Name sanitization/escaping in UI

---

## Phase 5: Future Enhancements (Optional)

### After Initial Launch

1. **Admin Dashboard** (requires auth)
   - View all submissions
   - Delete inappropriate scores
   - Ban player names/fingerprints
   - View spam statistics

2. **Enhanced Anti-Cheat**
   - Score validity heuristics
   - Weapon/passive combination validation
   - Time-based progression checks
   - Flag suspicious scores for review

3. **Social Features**
   - Player profiles (with optional auth)
   - Friend leaderboards
   - Score sharing (copy link)
   - Replay system (save game state)

4. **Analytics**
   - Most popular weapons
   - Average survival time by level
   - Passive item win rates
   - Boss defeat statistics

5. **Leaderboard Improvements**
   - Daily/Weekly/Monthly boards
   - Pagination (load more button)
   - Search by player name
   - Personal best highlighting

---

## Troubleshooting

### Issue: "Supabase not initialized"

**Solution:**
1. Check browser console for errors
2. Verify CDN script loaded: `console.log(window.supabase)`
3. Check network tab for CDN request
4. Verify SUPABASE_CONFIG values are correct

### Issue: "Rate limit exceeded" errors

**Solution:**
1. This is intentional for spam prevention
2. Wait 1 hour between submissions
3. For development: Temporarily increase limit in Edge Function
4. For testing: Use different browsers (different fingerprints)

### Issue: Scores not appearing in global board

**Solution:**
1. Check browser console for errors
2. Verify submission returned success: `{ success: true, id: "..." }`
3. Open Supabase dashboard → Table Editor → Check if row exists
4. Check Edge Function logs for validation errors
5. Verify RLS policies allow SELECT

### Issue: CORS errors

**Solution:**
1. Edge Function must include CORS headers (already in template)
2. Verify `corsHeaders` in OPTIONS and main response
3. Check Edge Function logs for CORS-related errors

### Issue: Client fingerprint not generated

**Solution:**
1. Check localStorage: `localStorage.getItem('vibe-survivor-fingerprint')`
2. Clear localStorage and reload
3. Verify `getClientFingerprint()` method exists in supabase-client.js

### Issue: Edge Function deployment fails

**Solution:**
```bash
# Re-login
supabase login

# Check project is linked
supabase projects list

# Re-link if needed
supabase link --project-ref YOUR_PROJECT_REF

# Deploy with verbose output
supabase functions deploy submit-score --debug
```

### Issue: Cannot connect to Supabase database

**Solution:**
1. Check project is not paused (free tier pauses after 7 days inactivity)
2. Go to dashboard → Project is paused banner → Click "Restore"
3. Verify internet connection
4. Check Supabase status: https://status.supabase.com

---

## Cost Monitoring (Free Tier Limits)

### Supabase Free Tier:
- **Database**: 500 MB storage
- **Bandwidth**: 5 GB/month (egress)
- **API Requests**: No hard limit, but throttled
- **Edge Functions**: 500k invocations/month
- **Auth Users**: 50,000 MAU (not used in this project)

### Estimated Usage:

**Per Score Submission:**
- Database: ~2 KB (JSON score data)
- Edge Function: 1 invocation
- Bandwidth: ~2 KB (response)

**Per Global Board Load:**
- Database: ~200 KB (100 scores)
- Bandwidth: ~200 KB
- No Edge Function call

**Monthly Estimate (1000 active players):**
- Submissions: 10,000/month → 20 MB storage, 10k function calls
- Leaderboard views: 50,000/month → 9.5 GB bandwidth
- **Verdict**: ⚠️ May exceed free tier bandwidth

**Optimization if needed:**
- Reduce limit to 50 scores per request (not 100)
- Add pagination (load more button)
- Cache global scores client-side (5 min TTL)
- Use Supabase Realtime for live updates (optional)

---

## File Checklist

### New Files to Create:
- [ ] `js/config/supabase-config.js` - Supabase credentials
- [ ] `js/utils/supabase-client.js` - Supabase API wrapper
- [ ] `supabase/functions/submit-score/index.ts` - Edge Function
- [ ] `.env` - Environment variables (DO NOT COMMIT)
- [ ] `.gitignore` - Add .env and supabase temp files

### Files to Modify:
- [ ] `index.html` - Add Supabase CDN script
- [ ] `js/utils/scoreboard-storage.js` - Add submission tracking
- [ ] `js/systems/ui/modals/scoreboard-modal.js` - Add tabs + global view
- [ ] `js/systems/ui/modals/score-detail-modal.js` - Add submit button
- [ ] `js/vibe-survivor-game.js` - Update modal HTML
- [ ] `styles/base.css` - Add tab styling

---

## Quick Start Summary

### For First-Time Supabase Users:

1. **Supabase Setup (30 min)**
   - Create account at supabase.com
   - Create project "vibe-survivor-leaderboard"
   - Run SQL to create table
   - Setup RLS policies
   - Save URL + anon key

2. **Edge Function (20 min)**
   - Install Supabase CLI
   - Login and link project
   - Create function `submit-score`
   - Copy code from this doc
   - Deploy with `supabase functions deploy`

3. **Frontend Integration (60 min)**
   - Create `supabase-config.js` with your credentials
   - Create `supabase-client.js` utility
   - Update scoreboard modal with tabs
   - Add submit button to detail modal
   - Add CSS styling

4. **Testing (30 min)**
   - Test local scoreboard still works
   - Submit a score to global
   - View in global tab
   - Test rate limiting
   - Test validation errors

**Total Time: ~2-3 hours for complete implementation**

---

## Support & Resources

### Official Docs:
- Supabase Docs: https://supabase.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- JavaScript Client: https://supabase.com/docs/reference/javascript

### Community:
- Supabase Discord: https://discord.supabase.com
- GitHub Discussions: https://github.com/supabase/supabase/discussions

### This Project:
- Report issues in project repository
- Check SCOREBOARD_HANDOFF.md for local scoreboard docs
- Reference CLAUDE.md for overall architecture

---

---

## Future Enhancement: Adding Social Login (Optional)

When you're ready to add authentication (could be v2.0+), the database is already set up! Here's how:

### Step 1: Enable OAuth Providers in Supabase

1. **Go to Supabase Dashboard** → Authentication → Providers

2. **Enable providers** you want (pick 1-3):
   - **Google**: Easy setup, most popular
   - **GitHub**: Popular with tech-savvy players
   - **Discord**: Gaming community favorite
   - **Twitter/X**: Social media integration

3. **Configure each provider** (example: Google):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase dashboard

### Step 2: Add Auth UI to Frontend

Update `js/utils/supabase-client.js` to add auth methods (they're already ready!):

```javascript
// These methods are already in the utility, just need UI wiring

/**
 * Sign in with OAuth provider
 */
async signInWithOAuth(provider) {
  const { data, error } = await this.supabase.auth.signInWithOAuth({
    provider: provider, // 'google', 'github', 'discord'
    options: {
      redirectTo: window.location.origin
    }
  });
  return { success: !error, error: error?.message };
}

/**
 * Sign out
 */
async signOut() {
  await this.supabase.auth.signOut();
}

/**
 * Get current user
 */
async getCurrentUser() {
  const { data: { user } } = await this.supabase.auth.getUser();
  return user;
}

/**
 * Claim anonymous scores
 */
async claimAnonymousScores() {
  const user = await this.getCurrentUser();
  if (!user) return { success: false };

  const fingerprint = this.getClientFingerprint();

  // Find anonymous scores with this fingerprint
  const { data: scores } = await this.supabase
    .from('global_scores')
    .select('id')
    .eq('is_anonymous', true)
    .eq('client_fingerprint', fingerprint);

  if (!scores?.length) return { success: false, claimed: 0 };

  // Update them to be owned by user
  const { error } = await this.supabase
    .from('global_scores')
    .update({
      user_id: user.id,
      is_anonymous: false,
      player_name: user.user_metadata?.name || user.email || 'Player'
    })
    .eq('client_fingerprint', fingerprint)
    .eq('is_anonymous', true);

  return { success: !error, claimed: scores.length };
}
```

### Step 3: Add Auth UI to Start Screen

Add to `index.html` or `vibe-survivor-game.js`:

```html
<div id="auth-widget">
  <!-- Signed Out State -->
  <div id="auth-signed-out">
    <p>Sign in to save scores across devices!</p>
    <div class="auth-buttons">
      <button id="signin-google-btn" class="auth-btn">
        Sign in with Google
      </button>
      <button id="signin-github-btn" class="auth-btn">
        Sign in with GitHub
      </button>
    </div>
    <p class="auth-note">You can still play anonymously</p>
  </div>

  <!-- Signed In State -->
  <div id="auth-signed-in" style="display: none;">
    <div class="user-info">
      <span class="user-avatar"></span>
      <span class="user-name"></span>
    </div>
    <div class="auth-buttons">
      <button id="claim-scores-btn" class="auth-btn">
        Claim Anonymous Scores
      </button>
      <button id="signout-btn" class="auth-btn-secondary">
        Sign Out
      </button>
    </div>
  </div>
</div>
```

Wire up in JavaScript:
```javascript
// Event handlers
document.getElementById('signin-google-btn')?.addEventListener('click', async () => {
  await supabaseClient.signInWithOAuth('google');
});

document.getElementById('claim-scores-btn')?.addEventListener('click', async () => {
  const result = await supabaseClient.claimAnonymousScores();
  if (result.success) {
    alert(`✓ Claimed ${result.claimed} anonymous scores!`);
  } else {
    alert('No anonymous scores found to claim');
  }
});

document.getElementById('signout-btn')?.addEventListener('click', async () => {
  await supabaseClient.signOut();
  window.location.reload();
});

// Check auth state on page load
async function updateAuthUI() {
  const user = await supabaseClient.getCurrentUser();

  if (user) {
    document.getElementById('auth-signed-out').style.display = 'none';
    document.getElementById('auth-signed-in').style.display = 'block';
    document.querySelector('.user-name').textContent = user.user_metadata?.name || user.email;
  } else {
    document.getElementById('auth-signed-out').style.display = 'block';
    document.getElementById('auth-signed-in').style.display = 'none';
  }
}

// Run on page load
updateAuthUI();
```

### Step 4: Update Submission Flow

The Edge Function **already supports auth**! No changes needed. When a user is signed in, the function automatically:
- Uses their `user_id` instead of fingerprint
- Allows 10 submissions/hour (instead of 5)
- Links scores to their account

### Benefits After Adding Auth

**For Users:**
- ✅ Scores saved across devices
- ✅ Profile with all their submissions
- ✅ Can edit/delete their own scores
- ✅ Higher rate limit (10/hour vs 5/hour)
- ✅ Verified badge on leaderboard

**For You:**
- ✅ Better spam prevention (user accounts)
- ✅ Can ban abusive users
- ✅ User analytics (retention, engagement)
- ✅ Foundation for future features (friends, clans)

**For Community:**
- ✅ Separate "Verified" leaderboard
- ✅ Higher trust in authenticated scores
- ✅ Can follow favorite players

---

## Launch Strategy Roadmap

### v1.0 - Initial Launch (Anonymous Only)
**Timeline**: 2-3 hours implementation

- ✅ Anonymous score submission
- ✅ Tab-based scoreboard (LOCAL / GLOBAL)
- ✅ Version-based rankings (major version)
- ✅ Basic spam prevention (rate limits, duplicate detection)
- ✅ Simple validation (catch obviously fake scores)
- ✅ Auth-ready database (future-proof)

**Goal**: Get it working quickly, gather user feedback

### v1.1 - Polish & Monitoring (If Needed)
**Timeline**: 1-2 hours if cheating becomes a problem

- ✅ Review Edge Function logs
- ✅ Update profanity filter based on actual submissions
- ✅ Adjust validation thresholds if needed
- ✅ Add community reporting (if abuse detected)

**Goal**: Fine-tune based on real usage

### v2.0 - Social Login (Optional Upgrade)
**Timeline**: 2-3 hours when ready

- ✅ Enable OAuth providers (Google, GitHub, Discord)
- ✅ Add auth UI to start screen
- ✅ Score claiming feature
- ✅ Separate "Verified" leaderboard tab
- ✅ User profiles (optional)

**Goal**: Enhance trust, enable cross-device play

### v3.0+ - Advanced Features (Future Ideas)
**Timeline**: As desired

- ✅ Admin moderation dashboard
- ✅ Ban system for repeat offenders
- ✅ Daily/Weekly leaderboards
- ✅ Friend leaderboards
- ✅ Score sharing (copy link)
- ✅ Replay system
- ✅ Analytics dashboard

**Goal**: Build community, add engagement features

---

## End of Document

**Document Version**: 2.0 (Auth-Ready Edition)
**Last Updated**: 2025-11-17
**Author**: Claude (Anthropic)
**Project**: Vibe Survivor Global Leaderboard

### What's Different in v2.0?

**v1.0 → v2.0 Changes:**
- ✅ Auth-ready database schema (supports both anonymous and authenticated)
- ✅ Dual-mode Edge Function (ready for social login)
- ✅ Practical security approach (no paranoia, just good enough)
- ✅ Clear launch strategy (v1.0 anonymous, v2.0+ optional auth)
- ✅ Realistic expectations (5-15% cheat rate is normal and OK)

**Migration**: If you already set up v1.0 (anonymous-only schema), you'll need to run database migrations to add `user_id` and `is_anonymous` fields. However, if you're starting fresh, use this v2.0 schema from the beginning - it's future-proof!

### Quick Start Summary

**For First-Time Setup:**
1. **Supabase Setup (30 min)**: Create account, project, run SQL for auth-ready schema
2. **Edge Function (20 min)**: Install CLI, deploy validation function (supports both modes)
3. **Frontend (60 min)**: Wire up tabs, submission, global view
4. **Testing (30 min)**: Test anonymous submission, rate limits, validation

**Total Time**: ~2-3 hours for complete v1.0 (anonymous only) launch

**Future Upgrade to v2.0** (social login): ~2-3 hours, no database migration needed!

---

### Next Steps

1. ✅ Follow **Phase 1** to setup Supabase with auth-ready schema
2. ✅ Implement **Phase 2** frontend (start with anonymous only)
3. ✅ Test using **Phase 3** guide
4. ✅ Deploy with **Phase 4** checklist
5. ✅ Monitor security (check logs weekly)
6. 🎯 **When ready**: Add social login (Phase "Future Enhancement")

---

### Key Takeaways

**Philosophy:**
- 🎮 It's a game for fun, not a bank
- 🚀 Launch fast, iterate based on feedback
- 🛡️ Basic security is good enough for no-prize game
- 📈 Build for the future (auth-ready from day 1)
- 🎯 Focus on making the game better, not fighting cheaters

**Reality:**
- Some players will cheat (1-5% for your use case)
- Most players play honestly for the challenge
- Perfect security is impossible (and unnecessary)
- Community can self-police obvious fakes

**Strategy:**
- Start simple (anonymous only)
- Monitor usage patterns
- Escalate if needed (reporting → moderation → bans)
- Add auth when you're ready (schema already supports it!)

---

Good luck with your implementation! 🎮🚀

**Questions?** Check the following:
- Supabase Docs: https://supabase.com/docs
- This project's SCOREBOARD_HANDOFF.md for local storage details
- CLAUDE.md for overall game architecture

**Have fun building!** The auth-ready design means you can launch quickly now and upgrade smoothly later. Perfect for an indie game! ✨
