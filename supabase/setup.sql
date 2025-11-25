-- Vibe Survivor Global Scoreboard Database Setup
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/mryuykhdoigmviqnwrwb/sql)

-- ============================================================================
-- 1. Create global_scores table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.global_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User identification (supports both anonymous and authenticated)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,

  -- Score data (stored as JSONB for flexibility)
  score_data JSONB NOT NULL,
  submission_date TIMESTAMPTZ DEFAULT NOW(),

  -- Game version tracking
  game_version TEXT NOT NULL,
  major_version TEXT NOT NULL,

  -- Spam prevention
  client_fingerprint TEXT,
  ip_address TEXT,

  -- Constraints
  CONSTRAINT player_name_length CHECK (char_length(player_name) >= 3 AND char_length(player_name) <= 20),
  CONSTRAINT valid_game_version CHECK (game_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  CONSTRAINT valid_major_version CHECK (major_version ~ '^[0-9]+\.[0-9]+$'),
  CONSTRAINT anonymous_needs_fingerprint CHECK (
    (is_anonymous = FALSE AND user_id IS NOT NULL) OR
    (is_anonymous = TRUE AND client_fingerprint IS NOT NULL)
  )
);

-- ============================================================================
-- 2. Create performance indexes
-- ============================================================================

-- Composite index for leaderboard queries (sorted by level DESC, time DESC)
CREATE INDEX IF NOT EXISTS idx_global_scores_composite ON public.global_scores(
  major_version,
  ((score_data->>'level')::int) DESC,
  ((score_data->>'time')::int) DESC
);

-- Index for submission_date (useful for recent scores queries)
CREATE INDEX IF NOT EXISTS idx_global_scores_submission_date ON public.global_scores(
  submission_date DESC
);

-- Index for client_fingerprint (spam prevention lookups)
CREATE INDEX IF NOT EXISTS idx_global_scores_fingerprint ON public.global_scores(
  client_fingerprint
);

-- ============================================================================
-- 3. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.global_scores ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Create RLS Policies
-- ============================================================================

-- Policy: Allow anyone to read scores (public leaderboard)
CREATE POLICY "Public read access" ON public.global_scores
  FOR SELECT
  USING (true);

-- Policy: Allow anonymous users to insert scores (with fingerprint required)
CREATE POLICY "Insert for anonymous users" ON public.global_scores
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL AND
    is_anonymous = TRUE AND
    client_fingerprint IS NOT NULL
  );

-- Policy: Allow authenticated users to insert scores (future v2.0)
CREATE POLICY "Insert for authenticated users" ON public.global_scores
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    is_anonymous = FALSE
  );

-- ============================================================================
-- 5. Create helper function for leaderboard queries
-- ============================================================================

CREATE OR REPLACE FUNCTION get_global_leaderboard(
  p_major_version TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  player_name TEXT,
  score_data JSONB,
  submission_date TIMESTAMPTZ,
  game_version TEXT,
  is_anonymous BOOLEAN,
  rank BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    id,
    player_name,
    score_data,
    submission_date,
    game_version,
    is_anonymous,
    ROW_NUMBER() OVER (
      ORDER BY
        (score_data->>'level')::int DESC,
        (score_data->>'time')::int DESC,
        submission_date ASC
    ) as rank
  FROM public.global_scores
  WHERE
    CASE
      WHEN p_major_version IS NOT NULL THEN major_version = p_major_version
      ELSE TRUE
    END
  ORDER BY
    (score_data->>'level')::int DESC,
    (score_data->>'time')::int DESC,
    submission_date ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================================================
-- Setup Complete!
-- ============================================================================

-- Verify table was created
SELECT 'Table created successfully!' as status, count(*) as score_count
FROM public.global_scores;
