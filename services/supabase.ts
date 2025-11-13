import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rwxcmcipnwmktxswgpni.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGNtY2lwbndta3R4c3dncG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzU3NjEsImV4cCI6MjA3ODQ1MTc2MX0._mH4GFMfFuP2--DSYuuLp9omNwW3ELWm84dML9UeVkk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);