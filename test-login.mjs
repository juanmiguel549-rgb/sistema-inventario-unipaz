import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let url = '';
let key = '';

// Lea el archivo de entorno si existe
try {
    const content = fs.readFileSync('./src/lib/supabase.ts', 'utf-8');
    const urlMatch = content.match(/const supabaseUrl = ['"]([^'"]+)['"]/);
    const keyMatch = content.match(/const supabaseKey = ['"]([^'"]+)['"]/);

    if (urlMatch && keyMatch) {
        url = urlMatch[1];
        key = keyMatch[1];
    }
} catch (e) {
    console.log('Error leyendo credenciales', e);
}

const supabase = createClient(url, key);

async function testLogin() {
    console.log('1. Attempting login for soporte@unipaz.edu.mx...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'soporte@unipaz.edu.mx',
        password: 'adminpassword123',
    });

    if (authError) {
        console.error('Auth Error:', authError.message);
        return;
    }

    console.log('Auth success. User ID:', authData.user.id);

    console.log('2. Fetching public profile by ID...');
    const { data: publicProfiles, error: profileError } = await supabase.from('users')
        .select('*')
        .eq('id', authData.user.id);

    console.log('Profile Fetch Result:', publicProfiles);
    if (profileError) {
         console.error('Profile Fetch Error:', profileError);
    }

    if (!publicProfiles || publicProfiles.length === 0) {
        console.log('3. Profile not found by ID. Fetching by email...');
        const { data: profilesByEmail, error: emailErr } = await supabase.from('users')
            .select('*')
            .eq('email', 'soporte@unipaz.edu.mx');
        
        console.log('Profile by Email Result:', profilesByEmail);
        if (emailErr) console.error('Email Fetch Error:', emailErr);

        if (profilesByEmail && profilesByEmail.length > 0) {
            console.log('4. Profile found by email. Attempting update...');
            const { error: updateError } = await supabase.from('users')
                .update({ 
                    id: authData.user.id, 
                    isActive: true,
                    role: 'ADMIN'
                })
                .eq('email', 'soporte@unipaz.edu.mx');
            
            console.log('Update Error (if any):', updateError);
        } else {
            console.log('4. Profile NOT found by email. Attempting insert...');
            const { error: insertError } = await supabase.from('users').insert([{
                id: authData.user.id,
                email: 'soporte@unipaz.edu.mx',
                name: 'soporte',
                role: 'ADMIN',
                isActive: true
            }]);
            console.log('Insert Error (if any):', insertError);
        }

        console.log('5. Re-fetching profile...');
        const { data: recoveredProfiles } = await supabase.from('users')
            .select('*')
            .eq('id', authData.user.id);
        console.log('Recovered Profile:', recoveredProfiles);
    }
}

testLogin();
