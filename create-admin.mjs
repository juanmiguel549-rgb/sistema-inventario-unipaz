import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let url = '';
let key = '';

// Lea el archivo de entorno si existe
try {
    const content = fs.readFileSync('./src/lib/supabase.ts', 'utf-8');
    const urlMatch = content.match(/const supabaseUrl = ['"]([^'"]+)['"]/);
    // Para signUp necesitamos la clave anon o el service_role (service_role no parece estar aquí)
    const keyMatch = content.match(/const supabaseKey = ['"]([^'"]+)['"]/);
    const anonKeyMatch = content.match(/const supabaseAnonKey = ['"]([^'"]+)['"]/);
    
    if (urlMatch) {
        url = urlMatch[1];
        key = keyMatch ? keyMatch[1] : (anonKeyMatch ? anonKeyMatch[1] : '');
    }
} catch (e) {
    console.log('Error leyendo credenciales', e);
}

const supabase = createClient(url, key);

async function createAdmin() {
    console.log('Attempting to create admin user...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'soporte@unipaz.edu.mx',
        password: 'adminpassword123',
        options: {
            data: {
                name: 'Administrador UNIPAZ',
                role: 'ADMIN',
                username: 'soporte'
            }
        }
    });

    if (authError) {
        console.error('Auth Error (it might already exist, ignoring):', authError.message);
    } else {
        console.log('User created successfully in Auth!', authData.user?.id);
    }
    
    // We should also try to ensure the password is correct if it exists
    console.log('Attempting to login to verify...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'soporte@unipaz.edu.mx',
        password: 'adminpassword123'
    });
    
    if (loginError) {
        console.error('Login failed. Maybe you need to verify email or password mismatch:', loginError.message);
    } else {
        console.log('Login successful! User ID:', loginData.user.id);
    }
}

createAdmin();
