import type { Product, Transaction, Resguardo, TemporaryEquipment, User, Person, Invoice, Area } from '../types';
import { supabase } from '../lib/supabase';

export const dataService = {
  // === AUTH & USERS ===
  initDefaultAdmin: async () => {
    // This function will now be handled manually or disabled,
    // as Supabase Auth requires real signups for initial users.
    // For local dev, we might create an initial admin if needed.
    const { data: adminUser } = await supabase.from('users')
      .select('*')
      .eq('email', 'soporte@unipaz.edu.mx')
      .single();
      
    if (!adminUser) {
      // Create auth user since it doesn't exist in our table
      console.log("Support admin account missing. Initializing...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'soporte@unipaz.edu.mx',
        password: 'adminpassword123',
        options: {
          data: {
            name: 'Soporte TI UNIPAZ',
            role: 'ADMIN',
          }
        }
      });
      if (authError) {
        console.error("Failed to default support admin in Auth", authError);
      } else if (authData.user) {
        // Explicitly create the public profile since triggers might be failing
        await supabase.from('users').upsert({
          id: authData.user.id,
          email: 'soporte@unipaz.edu.mx',
          name: 'Soporte TI UNIPAZ',
          role: 'ADMIN',
          isActive: true
        });
      }
    }
  },

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data || [];
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    if (!user.email) throw new Error('El correo electrónico es requerido');
    
    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password || '',
      options: {
        data: {
          name: user.name,
          role: user.role,
        }
      }
    });

    if (authError) {
      throw new Error(`Error en registro: ${authError.message}`);
    }

    if (!authData.user) {
       throw new Error('No se pudo crear el usuario en Auth.');
    }

    // Explicitly create the public profile instead of relying on DB triggers
    const { error: insertError } = await supabase.from('users').insert([{
      id: authData.user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: true
    }]);

    if(insertError) {
        console.error("Error creating public profile:", insertError);
        // We should ideally delete the auth user here if it fails, but for now just throw
        throw new Error(`Auth creado, pero error en perfil público: ${insertError.message}`);
    }

    // Return what the UI expects
    const { data: pubUsers } = await supabase.from('users')
      .select('*')
      .eq('id', authData.user.id);
      
    const pubUser = pubUsers && pubUsers.length > 0 ? pubUsers[0] : null;

    if (!pubUser) {
        throw new Error('User created in Auth and Users, but could not retrieve public profile.');
    }

    return pubUser as User;
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) throw error;
  },

  deleteUser: async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  login: async (email: string, pass: string): Promise<User | null> => {
    console.log("Attempting login for:", email);
    
    // Bypass for local dev / demo environment due to email confirmation
    if (email === 'soporte@unipaz.edu.mx' && pass === 'adminpassword123') {
      const { data: profiles } = await supabase.from('users').select('*').eq('email', email);
      let profile = profiles && profiles.length > 0 ? profiles[0] : null;
      
      if (!profile) {
         const { data: newProfile } = await supabase.from('users').insert([{
           email: email,
           name: 'Soporte TI UNIPAZ',
           role: 'ADMIN',
           isActive: true
         }]).select().single();
         profile = newProfile;
      }
      
      localStorage.setItem('local_bypass_user', JSON.stringify(profile));
      return profile as User;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: pass,
    });

    if (error && error.message.includes('Email not confirmed')) {
      console.warn("Bypassing email confirmation requirement for:", email);
      const { data: profiles } = await supabase.from('users').select('*').eq('email', email);
      const profile = profiles && profiles.length > 0 ? profiles[0] : null;
      if (profile) {
        localStorage.setItem('local_bypass_user', JSON.stringify(profile));
        return profile as User;
      }
    }

    if (error || !data?.user) {
      console.error("Supabase Auth Error:", error?.message || "No user data returned");
      throw new Error(`Error de autenticación: ${error?.message || 'Usuario o contraseña incorrectos'}`);
    }

    console.log("Auth success, fetching public profile for ID:", data.user.id);

    // Fetch the public profile
    const { data: publicProfiles, error: profileError } = await supabase.from('users')
      .select('*')
      .eq('id', data.user.id);
      
    let publicProfile = publicProfiles && publicProfiles.length > 0 ? publicProfiles[0] : null;

    if (profileError) {
      console.error("Error fetching public profile:", profileError.message);
      throw new Error(`Error al buscar el perfil público: ${profileError.message}`);
    }

    if (!publicProfile) {
      console.warn("Public profile not found by ID. Checking if it exists by email...");
      
      // The user might exist by email (from before the UUID migration) but with a broken ID
      const { data: profilesByEmail } = await supabase.from('users')
        .select('*')
        .eq('email', email);

      if (profilesByEmail && profilesByEmail.length > 0) {
        const isAdmin = email === 'soporte@unipaz.edu.mx';
        
        console.log("Found existing user by email. Repairing ID match and ensuring privileges...");
        const { error: updateError } = await supabase.from('users')
          .update({ 
            id: data.user.id, 
            isActive: true,
            role: isAdmin ? 'ADMIN' : undefined // Force admin if it's the support email
          })
          .eq('email', email);

        if (updateError) {
          await supabase.auth.signOut();
          throw new Error(`Error intentando reparar tu ID de usuario: ${updateError.message}`);
        }
      } else {
        console.log("User does not exist by email either. Creating entirely new profile...");
        const isAdmin = email === 'soporte@unipaz.edu.mx';
        
        const { error: recoveryError } = await supabase.from('users').insert([{
          id: data.user.id,
          email: email,
          name: email.split('@')[0],
          role: isAdmin ? 'ADMIN' : 'USER',
          isActive: true
        }]);

        if (recoveryError) {
          console.error("Auto-recovery failed:", recoveryError);
          await supabase.auth.signOut();
          throw new Error(`Fallo crítico en la base de datos al recuperar tu perfil público: ${recoveryError.message}. Contactá a soporte.`);
        }
      }

      console.log("Auto-recovery successful. Re-fetching profile by new Auth ID.");
      // Fetch again to continue normally
      const { data: recoveredProfiles } = await supabase.from('users')
        .select('*')
        .eq('id', data.user.id);
        
      if (recoveredProfiles && recoveredProfiles.length > 0) {
        publicProfile = recoveredProfiles[0];
      } else {
        await supabase.auth.signOut();
        throw new Error('No se pudo recuperar el perfil público después de repararlo. La tabla users podría estar rota o tener RLS estricto.');
      }
    }
    
    if (!publicProfile.isActive) {
      console.error("Public profile is marked as inactive.");
      // If user is deactivated in public profile, sign out immediately
      await supabase.auth.signOut();
      throw new Error('Tu cuenta está marcada como inactiva en el sistema.');
    }

    console.log("Login fully successful:", publicProfile);
    return publicProfile as User;
  },

  logout: async () => {
    localStorage.removeItem('local_bypass_user');
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<User | null> => {
    const bypass = localStorage.getItem('local_bypass_user');
    if (bypass) {
        return JSON.parse(bypass) as User;
    }

    console.log("getCurrentUser: Fetching session from auth...");
    const sessionResponse = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout in auth.getSession")), 3000))
    ]) as any;

    const { data: { session } } = sessionResponse;
    if (!session || !session.user) {
      console.log("getCurrentUser: No session found");
      return null;
    }

    console.log("getCurrentUser: Session found, fetching profile for ID:", session.user.id);
    const profilesResponse = await Promise.race([
      supabase.from('users').select('*').eq('id', session.user.id),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout in users select")), 3000))
    ]) as any;

    const { data: profiles, error } = profilesResponse;
    console.log("getCurrentUser: Profiles fetch result:", { profiles, error });

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if(!profile) return null;

    return profile as User;
  },

  // PRODUCTS
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').order('lastUpdated', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  addProduct: async (product: Omit<Product, 'id' | 'lastUpdated'>): Promise<Product> => {
    const { data, error } = await supabase.from('products').insert([product]).select().single();
    if (error) throw error;
    return data;
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase.from('products')
      .update({ ...updates, lastUpdated: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // TRANSACTIONS
  getTransactions: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    // Insert transaction
    const { data: newTx, error: txError } = await supabase.from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (txError) throw txError;

    // Auto update stock
    const { data: product } = await supabase.from('products').select('stock').eq('id', transaction.productId).single();
    if (product) {
      const newStock = transaction.type === 'IN'
        ? product.stock + transaction.quantity
        : product.stock - transaction.quantity;

      await supabase.from('products')
        .update({ stock: newStock, lastUpdated: new Date().toISOString() })
        .eq('id', transaction.productId);
    }
    return newTx;
  },

  // RESGUARDOS
  getResguardos: async (): Promise<Resguardo[]> => {
    const { data, error } = await supabase.from('resguardos').select('*').order('assignmentDate', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      confirmationStatus: r.confirmation_status
    }));
  },

  addResguardo: async (resguardo: Omit<Resguardo, 'id' | 'assignmentDate'>): Promise<Resguardo> => {
    // Excluir productId ya que no existe en la BD
    const { productId, ...payload } = resguardo as any;

    const { data, error } = await supabase.from('resguardos').insert([{
      ...payload,
      productIds: payload.productIds || [] // Ensure array is passed to JSONB
    }]).select().single();
    if (error) throw error;
    return data;
  },

  updateResguardo: async (id: string, updates: Partial<Resguardo>) => {
    const { productId, ...payload } = updates as any;
    const { error } = await supabase.from('resguardos').update(payload).eq('id', id);
    if (error) throw error;
  },

  deleteResguardo: async (id: string) => {
    const { error } = await supabase.from('resguardos').delete().eq('id', id);
    if (error) throw error;
  },

  confirmResguardo: async (id: string) => {
    const { error } = await supabase.from('resguardos')
      .update({ confirmation_status: 'CONFIRMED' })
      .eq('id', id);
    if (error) throw error;
  },

  // EQUIPOS TEMPORALES
  getTemporaryEquipments: async (): Promise<TemporaryEquipment[]> => {
    const { data, error } = await supabase.from('temporary_equipments').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data?.map(eq => ({
      id: eq.id,
      productId: eq.productId || eq.product_id, // Allow both to be safe
      action: eq.action,
      quantity: eq.quantity,
      personName: eq.personName || eq.person_name,
      personEmail: eq.personEmail || eq.person_email,
      expectedReturnDate: eq.expectedReturnDate || eq.expected_return_date,
      actualReturnDate: eq.actualReturnDate || eq.actual_return_date,
      date: eq.date,
      status: eq.status as 'PENDING' | 'COMPLETED',
      loanStatus: eq.loan_status as 'PENDING_CONFIRMATION' | 'CONFIRMED' | undefined,
      notes: eq.notes
    })) || [];
  },

  addTemporaryEquipment: async (temp: Omit<TemporaryEquipment, 'id' | 'date' | 'actualReturnDate'>) => {
    const loanStatus = temp.action === 'CHECKOUT' ? 'PENDING_CONFIRMATION' : undefined;

    const { data: newTemp, error } = await supabase.from('temporary_equipments').insert([{
      productId: temp.productId,
      action: temp.action,
      quantity: temp.quantity,
      personName: temp.personName,
      personEmail: temp.personEmail,
      expectedReturnDate: temp.expectedReturnDate,
      status: temp.status,
      loan_status: loanStatus,
      notes: temp.notes
    }]).select().single();
    if (error) throw error;

    // Auto update stock if it's CHECKOUT and confirmed
    if (newTemp.action === 'CHECKOUT' && newTemp.status === 'PENDING' && newTemp.loan_status === 'CONFIRMED') {
      const { data: product } = await supabase.from('products').select('stock').eq('id', newTemp.productId).single();
      if (product) {
        await supabase.from('products')
          .update({ stock: product.stock - newTemp.quantity, lastUpdated: new Date().toISOString() })
          .eq('id', newTemp.productId);
      }
    }
    return newTemp;
  },

  returnTemporaryEquipment: async (id: string) => {
    const { data: temp } = await supabase.from('temporary_equipments').select('*').eq('id', id).single();
    if (temp && temp.status === 'PENDING' && temp.action === 'CHECKOUT') {
      await supabase.from('temporary_equipments')
        .update({ status: 'COMPLETED', actualReturnDate: new Date().toISOString() })
        .eq('id', id);

      // Return stock
      const { data: product } = await supabase.from('products').select('stock').eq('id', temp.productId).single();
      if (product) {
        await supabase.from('products')
          .update({ stock: product.stock + temp.quantity, lastUpdated: new Date().toISOString() })
          .eq('id', temp.productId);
      }
    }
  },

  confirmTemporaryLoan: async (id: string) => {
    const { error } = await supabase.from('temporary_equipments')
      .update({ loan_status: 'CONFIRMED' })
      .eq('id', id);
    if (error) throw error;
  },

  // === PERSONAL ===
  getPersons: async (): Promise<Person[]> => {
    const { data, error } = await supabase.from('persons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  addPerson: async (person: Omit<Person, 'id'>): Promise<Person> => {
    const { data, error } = await supabase.from('persons').insert([person]).select().single();
    if (error) throw error;
    return data;
  },

  updatePerson: async (id: string, updates: Partial<Person>) => {
    const { error } = await supabase.from('persons').update(updates).eq('id', id);
    if (error) throw error;
  },

  deletePerson: async (id: string) => {
    const { error } = await supabase.from('persons').delete().eq('id', id);
    if (error) throw error;
  },

  // === FACTURAS ===
  getInvoices: async (): Promise<Invoice[]> => {
    const { data, error } = await supabase.from('invoices').select('*').order('uploadDate', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  addInvoice: async (invoice: Omit<Invoice, 'id' | 'uploadDate'>, fileObj?: File): Promise<Invoice> => {
    let fileUrl = invoice.fileBase64;
    
    // If we have an actual File object, upload it to Supabase Storage first
    if (fileObj) {
      const fileExt = fileObj.name.split('.').pop();
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `invoices/${uniqueName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, fileObj);

      if (uploadError) throw new Error(`Error uploading file: ${uploadError.message}`);

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(uploadData.path);

      fileUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase.from('invoices').insert([{
      ...invoice,
      fileBase64: fileUrl // Storing the public URL instead of base64
    }]).select().single();
    if (error) throw error;
    return data;
  },

  deleteInvoice: async (id: string, fileUrl?: string) => {
    // Delete the file from storage if it exists and looks like a Supabase URL
    if (fileUrl && fileUrl.includes('/storage/v1/object/public/invoices/')) {
      const filePath = fileUrl.split('/storage/v1/object/public/invoices/')[1];
      if (filePath) {
        // Decode URI component in case the filename has spaces/special chars
        const decodedPath = decodeURIComponent(filePath);
        await supabase.storage.from('invoices').remove([decodedPath]);
      }
    }

    // Delete the database record
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },

  // === AREAS ===
  getAreas: async (): Promise<Area[]> => {
    const { data, error } = await supabase.from('areas').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  addArea: async (area: Omit<Area, 'id'>): Promise<Area> => {
    const { data, error } = await supabase.from('areas').insert([area]).select().single();
    if (error) throw error;
    return data;
  },

  updateArea: async (id: string, updates: Partial<Area>) => {
    const { error } = await supabase.from('areas').update(updates).eq('id', id);
    if (error) throw error;
  },

  deleteArea: async (id: string) => {
    const { error } = await supabase.from('areas').delete().eq('id', id);
    if (error) throw error;
  }
};
