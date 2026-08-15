import React, { useState, useRef } from 'react';
import type { ClipboardEvent } from 'react';
import { X, Image as ImageIcon, Check, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGuideStore } from '@/store/useGuideStore';
import type { Guide as GuideType } from '@/store/useGuideStore';

interface GuideFormModalProps {
  onClose: () => void;
  defaultTab?: 'clinica' | 'bpm';
  guide?: GuideType;
}

export const GuideFormModal: React.FC<GuideFormModalProps> = ({ onClose, defaultTab = 'clinica', guide }) => {
  const addGuide = useGuideStore(s => s.addGuide);
  const updateGuide = useGuideStore(s => s.updateGuide);
  
  const [tipo, setTipo] = useState<'clinica' | 'bpm'>(guide ? guide.tipo : defaultTab);
  const [titulo, setTitulo] = useState(guide ? guide.titulo : '');
  const [contenido, setContenido] = useState(guide ? guide.contenido : '');
  const [enlaceUrl, setEnlaceUrl] = useState(guide ? guide.enlace_url || '' : '');
  
  // Estados para manejo de imágenes
  const [existingImages, setExistingImages] = useState<string[]>(
    guide && guide.imagenes_urls ? guide.imagenes_urls : []
  );
  const [deletedImagesUrls, setDeletedImagesUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const useRefInput = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    const addedPreviews = newFiles.map(file => URL.createObjectURL(file));
    setNewPreviews(prev => [...prev, ...addedPreviews]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const newImageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          newImageFiles.push(blob);
        }
      }
    }

    if (newImageFiles.length > 0) {
      addFiles(newImageFiles);
      toast.success(`${newImageFiles.length} imagen(es) pegada(s)`);
    }
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
    setDeletedImagesUrls(prev => [...prev, url]);
  };

  const removeNewImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
    if (useRefInput.current) {
      useRefInput.current.value = ''; // Reset input to allow re-selecting same file
    }
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !contenido.trim()) {
      return toast.error('El título y el contenido son obligatorios');
    }

    try {
      setIsSubmitting(true);
      if (guide) {
        await updateGuide(
          guide.id,
          {
            tipo,
            titulo,
            contenido,
            enlace_url: enlaceUrl.trim() || undefined,
            imagenes_urls: existingImages
          },
          files,
          deletedImagesUrls
        );
        toast.success('Registro actualizado correctamente');
      } else {
        await addGuide({ 
          tipo, 
          titulo, 
          contenido, 
          enlace_url: enlaceUrl.trim() || undefined,
          imagenes_urls: []
        }, files);
        toast.success('Norma guardada correctamente');
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar. Revisa tu conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6 animate-fade-in-up">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
        onPaste={handlePaste}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl md:text-2xl font-bold text-emerald-800 flex items-center gap-2">
            {guide ? 'Editar Protocolo / Norma' : 'Nuevo Protocolo / Norma'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Tipo selector */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-xl max-w-sm">
            <button
              onClick={() => setTipo('clinica')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                tipo === 'clinica' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dietoterapia
            </button>
            <button
              onClick={() => setTipo('bpm')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                tipo === 'bpm' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Normas BPM
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Título</label>
            <input 
              type="text" 
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
              placeholder="Ej. Lavado correcto de manos"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contenido / Descripción</label>
            <textarea 
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 resize-none"
              placeholder="Escribe los pasos o lineamientos de esta norma..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Enlace / Referencia (Opcional)</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="url" 
                value={enlaceUrl}
                onChange={(e) => setEnlaceUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-xl py-3 pr-3 pl-10 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                placeholder="https://ejemplo.com/documento.pdf"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Imágenes / Infografías (Opcional)</label>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {/* Imágenes existentes */}
              {existingImages.map((img, idx) => (
                <div key={`existing-${idx}`} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-square flex items-center justify-center group">
                  <img src={img} alt={`Existente ${idx + 1}`} className="max-h-full object-contain" />
                  <button 
                    onClick={() => removeExistingImage(img)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Quitar imagen"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {/* Previsualizaciones de nuevas imágenes */}
              {newPreviews.map((preview, idx) => (
                <div key={`new-${idx}`} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-square flex items-center justify-center group">
                  <img src={preview} alt={`Nueva previsualización ${idx + 1}`} className="max-h-full object-contain" />
                  <button 
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Quitar imagen"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              
              <div 
                onClick={() => useRefInput.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl aspect-square flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-emerald-400 transition-colors bg-gray-50/50 p-2"
              >
                <ImageIcon className="text-gray-400 mb-1" size={24} />
                <p className="text-xs font-semibold text-gray-700 leading-tight">Seleccionar<br/>Imágenes</p>
                <p className="text-[10px] text-gray-500 mt-1">O Ctrl+V</p>
                <input 
                  type="file" 
                  ref={useRefInput} 
                  onChange={handleFileChange}
                  accept="image/*" 
                  multiple
                  className="hidden" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl text-gray-600 font-semibold bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">{guide ? 'Actualizando...' : 'Guardando...'}</span>
            ) : (
              <>
                <Check size={20} />
                {guide ? 'Guardar Cambios' : 'Guardar Norma'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
