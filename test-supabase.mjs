import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let url = '';
let key = '';

// Lea el archivo de entorno si existe
try {
    const content = fs.readFileSync('./src/lib/supabase.ts', 'utf-8');
    const urlMatch = content.match(/const supabaseUrl = ['"]([^'"]+)['"]/);
    const keyMatch = content.match(/const supabaseAnonKey = ['"]([^'"]+)['"]/);

    if (urlMatch && keyMatch) {
        url = urlMatch[1];
        key = keyMatch[1];
    } else {
        console.error("No url match");
    }
} catch (e) {
    console.log('Error leyendo credenciales', e);
}

const supabase = createClient(url, key);

async function test() {
    console.log('Testing connection to Supabase...');

    // Test 1: get users
    const { data: users, error: selectErr } = await supabase.from('users').select('*');
    console.log('Select Users:', users);
    if (selectErr) console.log('Select Error details:', JSON.stringify(selectErr, null, 2));

    // Test 2: Login equivalent
    const { data: loginUsers, error: loginErr } = await supabase.from('users')
        .select('*')
        .eq('username', 'admin')
        .eq('password', '123')
        .eq('isActive', true);

    console.log('Login Users:', loginUsers);
    if (loginErr) console.log('Login Error details:', JSON.stringify(loginErr, null, 2));

    // Test 3: Insert (initDefaultAdmin)
    if (!users || users.length === 0) {
        console.log('Trying to insert admin...');
        const { data, error: insertErr } = await supabase.from('users').insert([{
            username: 'admin',
            password: '123',
            name: 'Administrador UNIPAZ',
            role: 'ADMIN',
            isActive: true
        }]).select();
        console.log('Insert Result:', data);
        if (insertErr) console.log('Insert Error details:', JSON.stringify(insertErr, null, 2));
    }
}

test();
