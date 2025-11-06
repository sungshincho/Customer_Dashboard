import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://audavudqfgtecwzndfgc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZGF2dWRxZmd0ZWN3em5kZmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzODU5NDAsImV4cCI6MjA3Nzk2MTk0MH0.DwH6zEq9-SuZySJ19Xb0tjbOmeoPzr6hyGHR_WKcg7M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
