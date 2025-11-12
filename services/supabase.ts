import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qeewxowpdvsqkpbniwed.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZXd4b3dwZHZzcWtwYm5pd2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NzgxNTEsImV4cCI6MjA3ODM1NDE1MX0.dGFzncOQyW7Ka8k4118yLYM47XREe5fxz5J3-41j62s';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
