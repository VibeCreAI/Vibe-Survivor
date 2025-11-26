/**
 * ScoreboardStorage - Local storage management for game scores
 * Handles saving, loading, filtering, and managing game records
 */

import { GAME_INFO } from '../config/constants.js';

const STORAGE_KEY = 'vibe-survivor-scoreboard';
const MAX_SCORES = 50;

export class ScoreboardStorage {
    /**
     * Initialize the scoreboard storage
     */
    constructor() {
        this.maxScores = MAX_SCORES;
        this.migrateScores();
    }

    /**
     * Get the current storage structure
     * @returns {Object} Storage object with schemaVersion and scores array
     */
    _getStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                return {
                    schemaVersion: GAME_INFO.SCOREBOARD_SCHEMA_VERSION,
                    scores: []
                };
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading scoreboard from localStorage:', error);
            return {
                schemaVersion: GAME_INFO.SCOREBOARD_SCHEMA_VERSION,
                scores: []
            };
        }
    }

    /**
     * Save storage structure to localStorage
     * @param {Object} storage - Storage object to save
     */
    _setStorage(storage) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
        } catch (error) {
            console.error('Error saving scoreboard to localStorage:', error);
            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded, removing old scores');
                // Remove bottom 20% of scores and try again
                const trimCount = Math.floor(storage.scores.length * 0.2);
                storage.scores = storage.scores.slice(0, -trimCount);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
                } catch (retryError) {
                    console.error('Failed to save even after trimming:', retryError);
                }
            }
        }
    }

    /**
     * Sort scores by rank (level DESC, time DESC, bosses DESC)
     * @param {Array} scores - Array of score objects
     * @returns {Array} Sorted scores
     */
    _sortScores(scores) {
        return scores.sort((a, b) => {
            // Primary: Level (higher is better)
            if (b.level !== a.level) {
                return b.level - a.level;
            }
            // Secondary: Time (longer is better)
            if (b.time !== a.time) {
                return b.time - a.time;
            }
            // Tertiary: Bosses killed (more is better)
            return b.bossesKilled - a.bossesKilled;
        });
    }

    /**
     * Save a new score to localStorage
     * @param {Object} scoreData - Complete score object
     * @returns {Object|null} Saved score object with ID, or null if failed
     */
    saveScore(scoreData) {
        try {
            const storage = this._getStorage();

            // Create score object with ID and date
            const score = {
                id: Date.now(),
                date: new Date().toISOString(),
                version: GAME_INFO.VERSION,
                majorVersion: GAME_INFO.MAJOR_VERSION,
                ...scoreData
            };

            // Add to scores array
            storage.scores.push(score);

            // Sort by rank
            storage.scores = this._sortScores(storage.scores);

            // Trim to max scores
            if (storage.scores.length > this.maxScores) {
                storage.scores = storage.scores.slice(0, this.maxScores);
            }

            // Save back to storage
            this._setStorage(storage);

            console.log('Score saved successfully:', score.id);
            return score;
        } catch (error) {
            console.error('Error saving score:', error);
            return null;
        }
    }

    /**
     * Get all scores
     * @returns {Array} All scores sorted by rank
     */
    getAllScores() {
        const storage = this._getStorage();
        return this._sortScores([...storage.scores]);
    }

    /**
     * Get scores filtered by major version
     * @param {string} majorVersion - Major version to filter (e.g., "1.0")
     * @returns {Array} Filtered and sorted scores
     */
    getScoresByVersion(majorVersion) {
        const storage = this._getStorage();
        const filtered = storage.scores.filter(score => score.majorVersion === majorVersion);
        return this._sortScores(filtered);
    }

    /**
     * Get top N scores, optionally filtered by version
     * @param {number} limit - Maximum number of scores to return
     * @param {string|null} majorVersion - Optional major version filter
     * @returns {Array} Top scores
     */
    getTopScores(limit = 10, majorVersion = null) {
        let scores;
        if (majorVersion) {
            scores = this.getScoresByVersion(majorVersion);
        } else {
            scores = this.getAllScores();
        }
        return scores.slice(0, limit);
    }

    /**
     * Get a specific score by ID
     * @param {number} id - Score ID (timestamp)
     * @returns {Object|null} Score object or null if not found
     */
    getScoreById(id) {
        const storage = this._getStorage();
        return storage.scores.find(score => score.id === id) || null;
    }

    /**
     * Delete a score by ID
     * @param {number} id - Score ID to delete
     * @returns {boolean} Success status
     */
    deleteScore(id) {
        try {
            const storage = this._getStorage();
            const initialLength = storage.scores.length;
            storage.scores = storage.scores.filter(score => score.id !== id);

            if (storage.scores.length < initialLength) {
                this._setStorage(storage);
                console.log('Score deleted:', id);
                return true;
            }

            console.warn('Score not found:', id);
            return false;
        } catch (error) {
            console.error('Error deleting score:', error);
            return false;
        }
    }

    /**
     * Clear all scores
     * @returns {boolean} Success status
     */
    clearAllScores() {
        try {
            const storage = {
                schemaVersion: GAME_INFO.SCOREBOARD_SCHEMA_VERSION,
                scores: []
            };
            this._setStorage(storage);
            console.log('All scores cleared');
            return true;
        } catch (error) {
            console.error('Error clearing scores:', error);
            return false;
        }
    }

    /**
     * Get unique major versions from all scores
     * @returns {Array} Sorted array of unique major versions (newest first)
     */
    getUniqueMajorVersions() {
        const storage = this._getStorage();
        const versions = new Set(storage.scores.map(score => score.majorVersion));
        return Array.from(versions).sort((a, b) => {
            // Simple string comparison works for semantic versions
            return b.localeCompare(a);
        });
    }

    /**
     * Get statistics about stored scores
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const storage = this._getStorage();
        const scores = storage.scores;

        if (scores.length === 0) {
            return {
                totalScores: 0,
                highestLevel: 0,
                longestTime: 0,
                mostBosses: 0,
                averageLevel: 0
            };
        }

        return {
            totalScores: scores.length,
            highestLevel: Math.max(...scores.map(s => s.level)),
            longestTime: Math.max(...scores.map(s => s.time)),
            mostBosses: Math.max(...scores.map(s => s.bossesKilled)),
            averageLevel: scores.reduce((sum, s) => sum + s.level, 0) / scores.length
        };
    }

    /**
     * Migrate scores when schema version changes
     * Handles data structure updates across versions
     */
    migrateScores() {
        try {
            const storage = this._getStorage();
            const currentVersion = GAME_INFO.SCOREBOARD_SCHEMA_VERSION;

            if (storage.schemaVersion === currentVersion) {
                // No migration needed
                return;
            }

            console.log(`Migrating scoreboard from schema v${storage.schemaVersion} to v${currentVersion}`);

            // Apply migrations based on schema version
            // For now, just update the version number
            // In future versions, add migration logic here:
            // if (storage.schemaVersion < 2) {
            //     // Migrate from v1 to v2
            //     storage.scores = storage.scores.map(score => ({
            //         ...score,
            //         newField: defaultValue
            //     }));
            // }

            storage.schemaVersion = currentVersion;
            this._setStorage(storage);

            console.log('Migration complete');
        } catch (error) {
            console.error('Error during migration:', error);
        }
    }

    /**
     * Export all scores as JSON (for backup or global sync)
     * @returns {string} JSON string of all scores
     */
    exportScores() {
        const storage = this._getStorage();
        return JSON.stringify(storage, null, 2);
    }

    /**
     * Import scores from JSON (for restore or global sync)
     * @param {string} jsonData - JSON string of scores
     * @returns {boolean} Success status
     */
    importScores(jsonData) {
        try {
            const importedStorage = JSON.parse(jsonData);

            // Validate structure
            if (!importedStorage.scores || !Array.isArray(importedStorage.scores)) {
                throw new Error('Invalid score data structure');
            }

            // Merge with existing scores (avoid duplicates by ID)
            const currentStorage = this._getStorage();
            const existingIds = new Set(currentStorage.scores.map(s => s.id));

            const newScores = importedStorage.scores.filter(s => !existingIds.has(s.id));
            currentStorage.scores.push(...newScores);

            // Sort and trim
            currentStorage.scores = this._sortScores(currentStorage.scores);
            if (currentStorage.scores.length > this.maxScores) {
                currentStorage.scores = currentStorage.scores.slice(0, this.maxScores);
            }

            this._setStorage(currentStorage);

            console.log(`Imported ${newScores.length} new scores`);
            return true;
        } catch (error) {
            console.error('Error importing scores:', error);
            return false;
        }
    }

    /**
     * Mark a local score as submitted to global leaderboard
     * @param {number} localId - Local score ID (timestamp)
     * @param {string} globalId - Global score ID (UUID from Supabase)
     * @param {string} playerName - Player name used for submission
     * @returns {boolean} Success status
     */
    markAsSubmitted(localId, globalId, playerName) {
        try {
            const storage = this._getStorage();
            const score = storage.scores.find(s => s.id === localId);

            if (!score) {
                console.warn('Score not found for marking as submitted:', localId);
                return false;
            }

            // Add submission metadata
            score.globalSubmission = {
                submitted: true,
                globalId: globalId,
                playerName: playerName,
                submissionDate: new Date().toISOString()
            };

            this._setStorage(storage);
            console.log('Score marked as submitted:', localId);
            return true;
        } catch (error) {
            console.error('Error marking score as submitted:', error);
            return false;
        }
    }

    /**
     * Get submission status for a score
     * @param {number} localId - Local score ID (timestamp)
     * @returns {Object|null} Submission status object or null if not submitted
     */
    getSubmissionStatus(localId) {
        try {
            const score = this.getScoreById(localId);

            if (!score) {
                return null;
            }

            // Return submission metadata if exists
            if (score.globalSubmission && score.globalSubmission.submitted) {
                return {
                    submitted: true,
                    globalId: score.globalSubmission.globalId,
                    playerName: score.globalSubmission.playerName,
                    submissionDate: score.globalSubmission.submissionDate
                };
            }

            return {
                submitted: false
            };
        } catch (error) {
            console.error('Error getting submission status:', error);
            return null;
        }
    }
}

// Create singleton instance
export const scoreboardStorage = new ScoreboardStorage();
