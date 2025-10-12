import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hoexaypimxpolqcumdqb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZXhheXBpbXhwb2xxY3VtZHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5ODY5NDEsImV4cCI6MjA3NTU2Mjk0MX0.xMHiNmwDYAq8fzUm2tBn7pLYwJvJ9gKcV3FqNISf3WU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
