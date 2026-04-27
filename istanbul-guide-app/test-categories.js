const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const code = fs.readFileSync('./services/supabase.ts', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
supabase.from('categories').select('name').then(res => console.log(res.data));
