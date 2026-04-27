const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const code = fs.readFileSync('./services/supabase.ts', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);
const supabase = createClient(urlMatch[1], keyMatch[1]);

async function check() {
    // See what happens if we insert a place without an ID (let Supabase generate UUID)
    // Actually, let's just see if there's an api_id column
    const { data, error } = await supabase.from('places').select('*').limit(1);
    console.log(Object.keys(data[0]));
}
check();
