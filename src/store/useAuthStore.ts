import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types';

interface AuthState {
  user: Usuario | null;
  loading: boolean;
  initialize: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true, // true by default until we check the session

  initialize: () => {
    // Escuchar cambios de sesión de Supabase
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch el perfil público desde la tabla usuarios
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          set({ user: data as Usuario, loading: false });
        } else {
          // Si no hay perfil aún, crear uno básico con la info del token
          set({ 
            user: {
              id: session.user.id,
              email: session.user.email || '',
              nombres: session.user.user_metadata?.nombres || '',
              apellidos: session.user.user_metadata?.apellidos || '',
              estado: 'activo'
            },
            loading: false 
          });
        }
      } else {
        set({ user: null, loading: false });
      }
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));
