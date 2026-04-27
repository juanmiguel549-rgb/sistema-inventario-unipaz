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
    const payload = {
        assignedTo: 'Test User',
        department: 'Test Dept',
        location: 'Test Loc',
        status: 'ACTIVO',
        notes: 'Test note',
        productIds: ['some-uuid-here'],
        productId: 'some-uuid-here' // Causes the error probably
    };

    const { data, error } = await supabase.from('resguardos').insert([payload]);
    console.log('Result:', data);
    if (error) console.log('Error specifics:', JSON.stringify(error, null, 2));
}

test();
