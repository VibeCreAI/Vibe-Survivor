/**
 * Supabase Configuration
 *
 * IMPORTANT: The anon key is safe to expose in the browser.
 * Row Level Security (RLS) policies protect your database.
 */

export const SUPABASE_CONFIG = {
    // Your Supabase project URL
    url: 'https://mryuykhdoigmviqnwrwb.supabase.co',

    // Your Supabase anon/public key (safe for client-side)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yeXV5a2hkb2lnbXZpcW53cndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDk2NDQsImV4cCI6MjA3OTU4NTY0NH0.qqe5aJ_axUhk1JyTi3PSm70TMe0M-BHi8xya3rnUBZY',

    // Edge Function URL for score submission
    edgeFunctionUrl: 'https://mryuykhdoigmviqnwrwb.supabase.co/functions/v1/submit-score'
};
