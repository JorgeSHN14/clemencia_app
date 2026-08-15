import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Guide {
  id: string;
  tipo: 'clinica' | 'bpm';
  titulo: string;
  contenido: string;
  imagenes_urls?: string[];
  enlace_url?: string;
  created_at: string;
}

interface GuideState {
  guides: Guide[];
  isLoading: boolean;
  fetchGuides: () => Promise<void>;
  addGuide: (guide: Omit<Guide, 'id' | 'created_at'>, files?: File[]) => Promise<void>;
  updateGuide: (
    id: string,
    guide: Omit<Guide, 'id' | 'created_at' | 'imagenes_urls'> & { imagenes_urls?: string[] },
    files?: File[],
    deletedImagesUrls?: string[]
  ) => Promise<void>;
  deleteGuide: (id: string, imagenesUrls?: string[]) => Promise<void>;
}

export const useGuideStore = create<GuideState>((set) => ({
  guides: [],
  isLoading: false,

  fetchGuides: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('guias')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      set({ guides: data || [] });
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addGuide: async (guide, files) => {
    try {
      let finalImagesUrls = guide.imagenes_urls || [];

      // Si hay archivos, los subimos al Storage concurrentemente
      if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name ? file.name.split('.').pop() : 'png';
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('guide_images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Obtener la URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('guide_images')
            .getPublicUrl(uploadData.path);
            
          return publicUrl;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        finalImagesUrls = [...finalImagesUrls, ...uploadedUrls];
      }

      const { data, error } = await supabase
        .from('guias')
        .insert([{ ...guide, imagenes_urls: finalImagesUrls.length > 0 ? finalImagesUrls : null }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ guides: [data, ...state.guides] }));
    } catch (error) {
      console.error('Error adding guide:', error);
      throw error;
    }
  },

  updateGuide: async (id, guide, files, deletedImagesUrls) => {
    try {
      // 1. Eliminar imágenes del storage si se descartaron
      if (deletedImagesUrls && deletedImagesUrls.length > 0) {
        const fileNames = deletedImagesUrls.map(url => {
          try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/');
            return pathSegments[pathSegments.length - 1];
          } catch (e) {
            console.error('Error parsing deleted image URL:', url, e);
            return '';
          }
        }).filter(Boolean);

        if (fileNames.length > 0) {
          await supabase.storage.from('guide_images').remove(fileNames);
        }
      }

      let finalImagesUrls = guide.imagenes_urls || [];

      // 2. Subir las nuevas imágenes
      if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name ? file.name.split('.').pop() : 'png';
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('guide_images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('guide_images')
            .getPublicUrl(uploadData.path);
            
          return publicUrl;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        finalImagesUrls = [...finalImagesUrls, ...uploadedUrls];
      }

      // 3. Actualizar en la base de datos
      const { data, error } = await supabase
        .from('guias')
        .update({
          tipo: guide.tipo,
          titulo: guide.titulo,
          contenido: guide.contenido,
          enlace_url: guide.enlace_url || null,
          imagenes_urls: finalImagesUrls.length > 0 ? finalImagesUrls : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 4. Actualizar estado en la app
      set((state) => ({
        guides: state.guides.map((g) => (g.id === id ? data : g))
      }));
    } catch (error) {
      console.error('Error updating guide:', error);
      throw error;
    }
  },

  deleteGuide: async (id, imagenesUrls) => {
    try {
      // Eliminar imágenes del storage si existen
      if (imagenesUrls && imagenesUrls.length > 0) {
        const fileNames = imagenesUrls.map(url => {
          const urlObj = new URL(url);
          const pathSegments = urlObj.pathname.split('/');
          return pathSegments[pathSegments.length - 1];
        }).filter(Boolean);

        if (fileNames.length > 0) {
          await supabase.storage.from('guide_images').remove(fileNames);
        }
      }

      const { error } = await supabase.from('guias').delete().eq('id', id);
      if (error) throw error;

      set((state) => ({ guides: state.guides.filter(g => g.id !== id) }));
    } catch (error) {
      console.error('Error deleting guide:', error);
      throw error;
    }
  }
}));
