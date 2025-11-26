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
      if (!/^[\p{L}\p{N}\s_-]+$/u.test(trimmedName)) {
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
