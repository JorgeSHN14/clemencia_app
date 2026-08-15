import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Inventory } from '@/pages/Inventory';
import { Menus } from '@/pages/Menus';
import { Patients } from '@/pages/Patients';
import { Guide } from '@/pages/Guide';
import { RecipeGenerator } from '@/pages/RecipeGenerator';
import { Login } from '@/pages/Auth/Login';
import { Register } from '@/pages/Auth/Register';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/inventory" replace />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/menus" element={<Menus />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/recipes" element={<RecipeGenerator />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;