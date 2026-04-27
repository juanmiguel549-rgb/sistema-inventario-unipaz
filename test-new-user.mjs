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

async function test() {
    const email = 'nuevoadmin' + Date.now() + '@unipaz.edu.mx';
    const password = 'password12345';
    
    console.log('Signing up', email);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: 'Nuevo Admin',
                role: 'ADMIN'
            }
        }
    });
    
    if (signUpError) {
        console.log('SignUp Error:', signUpError);
        return;
    }
    
    console.log('SignUp Success! Trying to login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (loginError) {
        console.log('Login Error:', loginError.message);
    } else {
        console.log('Login Success!', loginData.user.id);
        
        // Also insert into public.users to ensure it works
        const { error: insertError } = await supabase.from('users').upsert({
            id: loginData.user.id,
            email: email,
            name: 'Nuevo Admin',
            role: 'ADMIN',
            isActive: true
        });
        if (insertError) console.log('Insert profile error:', insertError.message);
        else console.log('Profile created in public.users');
        
        console.log('PLEASE USE THESE CREDENTIALS:');
        console.log('Email:', email);
        console.log('Password:', password);
    }
}

test();
