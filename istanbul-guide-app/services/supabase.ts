import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzmixtclyewsaydbofkg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bWl4dGNseWV3c2F5ZGJvZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODc5OTcsImV4cCI6MjA4OTg2Mzk5N30.7vSg7vDjJJfTdAGJDSTWWJLeDNXKKoIDLk_TGNe5tt4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});