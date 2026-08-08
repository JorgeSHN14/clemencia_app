import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, ChevronDown, ChevronUp, Plus, Trash2, Activity, ArrowRight } from 'lucide-react';
import { useGuideStore } from '@/store/useGuideStore';
import type { Guide as GuideType } from '@/store/useGuideStore';
import { GuideFormModal } from './GuideFormModal';

interface AccordionItemProps {
  guide: GuideType;
  isOpen: boolean;
  onToggle: () => void;
  onImageClick: (url: string) => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ guide, isOpen, onToggle, onImageClick }) => {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md mb-3 relative group">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex justify-between items-center bg-white text-left focus:outline-none"
      >
        <span className="font-semibold text-gray-800 text-lg pr-8">{guide.titulo}</span>
        <span className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 animate-fade-in-up">
          <div className="h-px w-full bg-gray-100 mb-4"></div>
          
          {guide.imagenes_urls && guide.imagenes_urls.length > 0 && (
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {guide.imagenes_urls.map((img, idx) => (
                <div 
                  key={idx} 
                  className="rounded-xl overflow-hidden bg-gray-50 flex justify-center border border-gray-100 cursor-pointer"
                  onClick={() => onImageClick(img)}
                >
                  <img src={img} alt={`${guide.titulo} - img ${idx + 1}`} className="max-h-80 object-contain hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          )}
          
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
            {guide.contenido}
          </p>

          {guide.enlace_url && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a 
                href={guide.enlace_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition-colors"
              >
                Abrir Enlace de Referencia
                <ArrowRight size={16} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface BpmPostCardProps {
  guide: GuideType;
  onImageClick: (url: string) => void;
}

const BpmPostCard: React.FC<BpmPostCardProps> = ({ guide, onImageClick }) => {
  return (
    <div className="border border-gray-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all relative group flex flex-col h-full w-full">
      {/* Header del post */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{guide.titulo}</h3>
            <p className="text-xs text-gray-400">Norma BPM</p>
          </div>
        </div>
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
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const { guides, fetchGuides, isLoading } = useGuideStore();

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const handleTabChange = (tab: 'clinica' | 'bpm') => {
    setActiveTab(tab);
    setOpenIndex(null); // Cerrar acordeones al cambiar de pestaña
  };

  const toggleAccordion = (id: string) => {
    setOpenIndex(prevId => (prevId === id ? null : id));
  };

  const filteredGuides = guides.filter(g => g.tipo === activeTab);

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

      {/* Listado de Contenido según la pestaña seleccionada */}
      <section className="pt-2">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700">Aún no hay registros</h3>
            <p className="text-gray-500 mt-2">Haz clic en "Añadir Norma" para crear tu primer {activeTab === 'clinica' ? 'protocolo clínico' : 'post de BPM'}.</p>
          </div>
        ) : activeTab === 'clinica' ? (
          <div className="space-y-2 max-w-4xl">
            {filteredGuides.map((guide) => (
              <AccordionItem 
                key={guide.id} 
                guide={guide}
                isOpen={openIndex === guide.id}
                onToggle={() => toggleAccordion(guide.id)}
                onImageClick={setFullscreenImage}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-6xl mx-auto w-full">
            {filteredGuides.map((guide) => (
              <BpmPostCard 
                key={guide.id} 
                guide={guide}
                onImageClick={setFullscreenImage}
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
            <Trash2 className="hidden" /> {/* Para mantener import vivo y no fallar ts */}
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
