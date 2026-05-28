// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  // Safe fallbacks prevent Next.js from crashing during 'npm run build'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hfyqejmlgabmwfsazuud.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmeXFlam1sZ2FibXdmc2F6dXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTM1NjQsImV4cCI6MjA5NDQ4OTU2NH0.dZs31I1OJQzfGrlKkyxY8PRUkzpGUFP4GofbrfJApIQ';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};