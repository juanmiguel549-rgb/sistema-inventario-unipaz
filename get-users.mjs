import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let url = '';
let key = '';

try {
    const content = fs.readFileSync('./src/lib/supabase.ts', 'utf-8');
    const urlMatch = content.match(/const supabaseUrl = ['"]([^'"]+)['"]/);
    const keyMatch = content.match(/const supabaseKey = ['"]([^'"]+)['"]/);
    if (urlMatch && keyMatch) {
        url = urlMatch[1];
        key = keyMatch[1];
    }
} catch (e) {
    console.log('Error', e);
}

const supabase = createClient(url, key);

async function get() {
    const { data: users, error } = await supabase.from('users').select('*');
    console.log('Users in public.users:', users);
    if (error) console.log('Error:', error);
}

get();
