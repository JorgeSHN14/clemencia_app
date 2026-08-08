import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Package, CalendarDays, Users, BookOpen, Utensils, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { usePatientStore } from '@/store/usePatientStore';

export const AppLayout: React.FC = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const fetchInventory = useInventoryStore(s => s.fetchInventory);
  const fetchRecipes = useRecipeStore(s => s.fetchRecipes);
  const fetchPatients = usePatientStore(s => s.fetchPatients);

  useEffect(() => {
    fetchInventory();
    fetchRecipes();
    fetchPatients();
  }, [fetchInventory, fetchRecipes, fetchPatients]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/inventory', icon: <Package size={24} />, label: 'Inventario' },
    { to: '/recipes', icon: <Utensils size={24} />, label: 'Recetas' },
    { to: '/menus', icon: <CalendarDays size={24} />, label: 'Menús' },
    { to: '/patients', icon: <Users size={24} />, label: 'Pacientes' },
    { to: '/guide', icon: <BookOpen size={24} />, label: 'Guía' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar para Desktop (md+) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full shadow-sm z-20">
        <div className="p-6 bg-emerald-600 text-white flex-shrink-0">
          <h1 className="text-xl font-bold">Fundación Clemencia</h1>
          <p className="text-emerald-100 text-xs mt-1">Gestión Nutricional</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-medium ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 px-2">
            <p className="text-sm font-bold text-gray-700 truncate">{user?.nombres} {user?.apellidos}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header solo visible en Mobile */}
        <header className="md:hidden bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-10 flex-shrink-0 flex justify-between items-center">
          <h1 className="text-xl font-bold">Fundación Clemencia</h1>
          <button onClick={handleLogout} className="p-1 hover:bg-emerald-700 rounded-md transition-colors">
            <LogOut size={20} />
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation para Mobile (<md) */}
        <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-20 pb-safe">
          <ul className="flex justify-around items-center h-16 px-2">
            {navItems.map((item) => (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                      isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-500'
                    }`
                  }
                >
                  {item.icon}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};
