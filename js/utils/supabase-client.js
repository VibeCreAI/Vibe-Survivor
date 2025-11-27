/**
 * Supabase Client Utility
 *
 * Handles all interactions with Supabase for the global leaderboard.
 * Uses the Supabase JS client loaded via CDN.
 */

import { SUPABASE_CONFIG } from '../config/supabase-config.js';

class SupabaseClient {
    constructor() {
        this.client = null;
        this.initialized = false;
        this.fingerprint = null;
    }

    /**
     * Initialize the Supabase client from CDN global
     * Must be called after the CDN script loads
     */
    init() {
        if (this.initialized) {
            return true;
        }

        // Check if Supabase is available from CDN
        if (typeof window.supabase === 'undefined') {
            console.warn('Supabase CDN not loaded. Global leaderboard features disabled.');
            return false;
        }

        try {
            // Create Supabase client
            this.client = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );

            // Generate and store client fingerprint
            this.fingerprint = this.getClientFingerprint();

            this.initialized = true;
            console.log('Supabase client initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase client:', error);
            return false;
        }
    }

    /**
     * Generate a client fingerprint for spam prevention
     * Simple hash based on browser characteristics
     * Not cryptographically secure, just for basic spam prevention
     */
    getClientFingerprint() {
        // Try to get from localStorage first (for consistency)
        const stored = localStorage.getItem('vibe-survivor-fingerprint');
        if (stored) {
            return stored;
        }

        // Generate new fingerprint
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.platform
        ];

        const fingerprint = this.simpleHash(components.join('|||'));

        // Store for future use
        try {
            localStorage.setItem('vibe-survivor-fingerprint', fingerprint);
        } catch (e) {
            // localStorage might be disabled
            console.warn('Could not store fingerprint:', e);
        }

        return fingerprint;
    }

    /**
     * Simple hash function for fingerprinting
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return 'fp_' + Math.abs(hash).toString(36);
    }

    /**
     * Submit a score to the global leaderboard via Edge Function
     *
     * @param {Object} scoreData - The score data object from local storage
     * @param {string} playerName - The player's display name
     * @param {string} gameVersion - Full game version (e.g., "1.0.1")
     * @param {string} majorVersion - Major version (e.g., "1.0")
     * @returns {Promise<Object>} - { success: boolean, id?: string, error?: string }
     */
    async submitScore(scoreData, playerName, gameVersion, majorVersion) {
        if (!this.initialized) {
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            // Client-side validation
            const validation = this.validateSubmission(playerName, scoreData);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // Sanitize score data - ensure numeric fields are integers
            const sanitizedScoreData = this.sanitizeScoreData(scoreData);

            // Prepare submission data
            const payload = {
                player_name: playerName.trim(),
                score_data: sanitizedScoreData,
                game_version: gameVersion,
                major_version: majorVersion,
                client_fingerprint: this.fingerprint
            };

            // Submit via Edge Function (server-side validation)
            const response = await fetch(SUPABASE_CONFIG.edgeFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                    'apikey': SUPABASE_CONFIG.anonKey
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Submission failed');
            }

            return {
                success: true,
                id: result.id,
                is_anonymous: result.is_anonymous
            };

        } catch (error) {
            console.error('Score submission error:', error);
            return {
                success: false,
                error: error.message || 'Failed to submit score'
            };
        }
    }

    /**
     * Client-side validation before submission
     */
    validateSubmission(playerName, scoreData) {
        // Validate player name
        if (!playerName || typeof playerName !== 'string') {
            return { valid: false, error: 'Player name is required' };
        }

        const trimmedName = playerName.trim();
        if (trimmedName.length < 3 || trimmedName.length > 20) {
            return { valid: false, error: 'Player name must be 3-20 characters' };
        }

        if (!/^[\p{L}\p{N}\s_-]+$/u.test(trimmedName)) {
            return { valid: false, error: 'Player name can only contain letters, numbers, spaces, _ and -' };
        }

        // Validate score data exists
        if (!scoreData || typeof scoreData !== 'object') {
            return { valid: false, error: 'Invalid score data' };
        }

        if (!scoreData.level || !scoreData.time) {
            return { valid: false, error: 'Score must include level and time' };
        }

        return { valid: true };
    }

    /**
     * Sanitize score data - ensure all numeric fields are integers
     * Fixes floating-point precision issues (e.g., 101.39999999999553 -> 101)
     */
    sanitizeScoreData(scoreData) {
        const sanitized = { ...scoreData };

        // Round numeric fields to integers
        if (sanitized.level !== undefined) {
            sanitized.level = Math.round(sanitized.level);
        }
        if (sanitized.time !== undefined) {
            sanitized.time = Math.round(sanitized.time);
        }
        if (sanitized.enemiesKilled !== undefined) {
            sanitized.enemiesKilled = Math.round(sanitized.enemiesKilled);
        }
        if (sanitized.bossesKilled !== undefined) {
            sanitized.bossesKilled = Math.round(sanitized.bossesKilled);
        }

        return sanitized;
    }

    /**
     * Fetch global leaderboard scores
     *
     * @param {Object} options - Query options
     * @param {string} options.majorVersion - Filter by major version (e.g., "1.0")
     * @param {number} options.limit - Number of scores to fetch (default: 100)
     * @param {number} options.offset - Offset for pagination (default: 0)
     * @returns {Promise<Object>} - { success: boolean, scores?: Array, error?: string }
     */
    async fetchGlobalScores({ majorVersion = null, limit = 100, offset = 0 } = {}) {
        if (!this.initialized) {
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            let query = this.client
                .from('global_scores')
                .select('*')
                // Order: bosses desc, enemies desc, time desc, submission_date asc
                .order('score_data->bossesKilled', { ascending: false })
                .order('score_data->enemiesKilled', { ascending: false })
                .order('score_data->time', { ascending: false })
                .order('submission_date', { ascending: true })
                .range(offset, offset + limit - 1);

            // Filter by version if specified
            if (majorVersion) {
                query = query.eq('major_version', majorVersion);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            // Calculate ranks
            const scoresWithRank = data.map((score, index) => ({
                ...score,
                rank: offset + index + 1
            }));

            return {
                success: true,
                scores: scoresWithRank
            };

        } catch (error) {
            console.error('Fetch global scores error:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch scores'
            };
        }
    }

    /**
     * Get a specific score by ID
     *
     * @param {string} scoreId - UUID of the score
     * @returns {Promise<Object>} - { success: boolean, score?: Object, error?: string }
     */
    async getScoreById(scoreId) {
        if (!this.initialized) {
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            const { data, error } = await this.client
                .from('global_scores')
                .select('*')
                .eq('id', scoreId)
                .single();

            if (error) {
                throw error;
            }

            return {
                success: true,
                score: data
            };

        } catch (error) {
            console.error('Get score by ID error:', error);
            return {
                success: false,
                error: error.message || 'Score not found'
            };
        }
    }

    /**
     * Check if Supabase is available and working
     */
    isAvailable() {
        return this.initialized && this.client !== null;
    }
}

// Export singleton instance
export const supabaseClient = new SupabaseClient();
