import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Resguardos } from './pages/Resguardos';
import { EquiposTemporales } from './pages/EquiposTemporales';
import { PrestamosActivos } from './pages/PrestamosActivos';
import { Login } from './pages/Login';
import { Users } from './pages/Users';
import { Personnel } from './pages/Personnel';
import { Invoices } from './pages/Invoices';
import { Areas } from './pages/Areas';
import { ConfirmLoan } from './pages/ConfirmLoan';
import { ConfirmResguardo } from './pages/ConfirmResguardo';
import { dataService } from './services/dataService';
import { supabase } from './lib/supabase';
import type { User } from './types';
import './index.css';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Manejar enrutamiento
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);

    // Initial session check
    const checkSession = async () => {
      console.log("checkSession started");
      try {
        console.log("Calling dataService.getCurrentUser()...");
        const user = await Promise.race([
          dataService.getCurrentUser(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("getCurrentUser timeout after 5s")), 5000))
        ]) as User | null;
        console.log("getCurrentUser resolved:", user);
        setCurrentUser(user);
      } catch (error) {
        console.error("Session check error", error);
      } finally {
        console.log("Setting isInitializing and loading to false");
        setIsInitializing(false);
        setLoading(false);
      }
    };
    checkSession();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session) {
          const user = await dataService.getCurrentUser();
          setCurrentUser(user);
        } else {
          const localUser = await dataService.getCurrentUser();
          if (localUser) {
            setCurrentUser(localUser);
          } else {
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      }
    });
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPath('/');
  };

  const handleLogout = () => {
    dataService.logout();
    setCurrentUser(null);
  };

  if (isInitializing || loading) { // Combined conditions
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>;
  }

  // Public Routes Check
  const urlParams = new URLSearchParams(window.location.search);
  const confirmLoanId = urlParams.get('confirm_loan');
  const isConfirmingResguardo = urlParams.has('confirm_resguardo');
  
  if (confirmLoanId) {
    return <ConfirmLoan loanId={confirmLoanId} />;
  }
  
  if (isConfirmingResguardo) {
    return <ConfirmResguardo />;
  }

  // Si no hay sesión, mostrar login
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return <Dashboard />;
      case '/products':
        return <Products />;
      case '/resguardos':
        return <Resguardos />;
      case '/temporal':
        return <EquiposTemporales />;
      case '/active-loans':
        return <PrestamosActivos />;
      case '/personnel':
        return <Personnel />;
      case '/invoices':
        return <Invoices />;
      case '/areas':
        return <Areas />;
      case '/users':
        return currentUser.role === 'ADMIN' ? <Users /> : <div style={{ padding: '2rem', textAlign: 'center' }}>Acceso denegado. No tienes permisos de administrador.</div>;
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={setCurrentPath} currentUser={currentUser} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}

export default App;
