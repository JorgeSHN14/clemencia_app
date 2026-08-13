import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, Plus, Trash2, Activity, ArrowRight, Search, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGuideStore } from '@/store/useGuideStore';
import type { Guide as GuideType } from '@/store/useGuideStore';
import { GuideFormModal } from './GuideFormModal';

interface GuideCardProps {
  guide: GuideType;
  onImageClick: (url: string) => void;
  onDelete: (id: string, urls?: string[]) => Promise<void>;
}

const GuideCard: React.FC<GuideCardProps> = ({ guide, onImageClick, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      try {
        setIsDeleting(true);
        await onDelete(guide.id, guide.imagenes_urls);
        toast.success('Eliminado correctamente');
      } catch (error) {
        console.error(error);
        toast.error('Error al eliminar');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const isClinica = guide.tipo === 'clinica';

  return (
    <div className="border border-gray-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all relative group flex flex-col h-full w-full">
      {/* Header del post */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            {isClinica ? <Activity size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg leading-tight">{guide.titulo}</h3>
            <p className="text-xs text-gray-400">
              {isClinica ? 'Dietoterapia Clínica' : 'Norma BPM'}
            </p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-gray-400 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Galería de imágenes en carrusel vertical o simple stack */}
      {guide.imagenes_urls && guide.imagenes_urls.length > 0 && (
        <div className={`w-full bg-gray-50 border-b border-gray-50 flex overflow-x-auto snap-x snap-mandatory ${guide.imagenes_urls.length === 1 ? 'justify-center' : 'justify-start'}`}>
          {guide.imagenes_urls.map((img, idx) => (
            <div 
              key={idx} 
              className="min-w-full flex-shrink-0 snap-center flex justify-center cursor-pointer"
              onClick={() => onImageClick(img)}
            >
              <img src={img} alt={`${guide.titulo} - ${idx + 1}`} className="w-full h-[300px] object-cover hover:opacity-90 transition-opacity" />
            </div>
          ))}
        </div>
      )}

      {/* Indicadores de carrusel (Solo si hay más de 1) */}
      {guide.imagenes_urls && guide.imagenes_urls.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3 bg-white">
          {guide.imagenes_urls.map((_, idx) => (
            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
          ))}
        </div>
      )}

      {/* Contenido / Texto */}
      <div className="p-5 flex flex-col flex-grow">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm flex-grow">
          {guide.contenido}
        </p>
        
        {guide.enlace_url && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a 
              href={guide.enlace_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition-colors w-full justify-center md:w-auto"
            >
              Abrir Enlace de Referencia
              <ArrowRight size={16} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export const Guide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clinica' | 'bpm'>('clinica');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recientes' | 'alfabetico-az' | 'alfabetico-za'>('recientes');

  const { guides, fetchGuides, deleteGuide, isLoading } = useGuideStore();

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const handleTabChange = (tab: 'clinica' | 'bpm') => {
    setActiveTab(tab);
    setSearchTerm('');
  };

  const filteredAndSortedGuides = guides
    .filter(g => g.tipo === activeTab)
    .filter(g => 
      g.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.contenido.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'alfabetico-az') {
        return a.titulo.localeCompare(b.titulo);
      }
      if (sortBy === 'alfabetico-za') {
        return b.titulo.localeCompare(a.titulo);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6 pb-6 animate-fade-in-up">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mt-4 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-700 flex items-center gap-2 mb-2">
            <BookOpen size={32} />
            Guías y Protocolos
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Manual de referencia rápida para protocolos de dietoterapia clínica y estándares de seguridad y manufactura alimentaria (BPM).
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 md:px-5 md:py-3 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2 flex-shrink-0"
        >
          <Plus size={20} />
          <span className="font-semibold text-sm">Añadir Norma</span>
        </button>
      </header>

      {/* Tabs / Pestañas de Navegación */}
      <div className="flex bg-gray-100/80 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => handleTabChange('clinica')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'clinica' 
              ? 'bg-white text-emerald-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity size={18} />
          Dietoterapia Clínica
        </button>
        <button
          onClick={() => handleTabChange('bpm')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'bpm' 
              ? 'bg-white text-emerald-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck size={18} />
          Normas BPM
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 p-4 rounded-3xl border border-gray-100/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={`Buscar en ${activeTab === 'clinica' ? 'dietoterapias' : 'normas'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-16 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm text-gray-700 transition-all placeholder:text-gray-400 shadow-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3.5 top-3.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100/80 px-2 py-1 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">Ordenar por:</label>
          <div className="relative w-full sm:w-48">
            <ArrowUpDown className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" size={16} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-10 pr-8 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm text-gray-700 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="recientes">Más recientes</option>
              <option value="alfabetico-az">Título (A - Z)</option>
              <option value="alfabetico-za">Título (Z - A)</option>
            </select>
            <div className="absolute right-3.5 top-4.5 pointer-events-none text-gray-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Listado de Contenido según la pestaña seleccionada */}
      <section className="pt-2">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : filteredAndSortedGuides.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700">
              {searchTerm ? 'Sin resultados' : 'Aún no hay registros'}
            </h3>
            <p className="text-gray-500 mt-2">
              {searchTerm 
                ? `No encontramos registros que coincidan con "${searchTerm}".`
                : `Haz clic en "Añadir Norma" para crear tu primer ${activeTab === 'clinica' ? 'protocolo clínico' : 'post de BPM'}.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-6xl mx-auto w-full">
            {filteredAndSortedGuides.map((guide) => (
              <GuideCard 
                key={guide.id} 
                guide={guide}
                onImageClick={setFullscreenImage}
                onDelete={deleteGuide}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal Formulario */}
      {isModalOpen && (
        <GuideFormModal 
          onClose={() => setIsModalOpen(false)} 
          defaultTab={activeTab}
        />
      )}

      {/* Visor de imagen en pantalla completa */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
            onClick={() => setFullscreenImage(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen" 
            className="max-w-full max-h-full object-contain cursor-zoom-out"
            onClick={(e) => e.stopPropagation()} // Evita cerrar si clickeas la imagen por error
          />
        </div>
      )}
    </div>
  );
};
