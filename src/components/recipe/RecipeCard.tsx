import React from 'react';
import type { Receta } from '@/types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface RecipeCardProps {
  recipe: Receta;
  isGenerated?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isGenerated = false }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden transition-all hover:shadow-md hover:border-emerald-200 group">
      
      {/* Header Visual */}
      <div className={`p-5 border-b ${isGenerated ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'} relative`}>
        {isGenerated && (
          <div className="absolute top-3 right-3 bg-white text-blue-600 text-[10px] font-black px-2 py-1 rounded-md shadow-sm flex items-center gap-1 border border-blue-100">
            <Sparkles size={12} />
            IA
          </div>
        )}
        <h2 className="text-lg font-black text-gray-800 pr-8 line-clamp-2 min-h-[3.5rem]">{recipe.titulo}</h2>
        <div className="flex flex-wrap gap-2 text-xs font-bold mt-3">
          <span className={`px-2 py-1 rounded-lg ${isGenerated ? 'bg-blue-100/50 text-blue-700' : 'bg-emerald-100/50 text-emerald-700'}`}>
            🔥 {recipe.calorias} kcal
          </span>
          <span className={`px-2 py-1 rounded-lg ${isGenerated ? 'bg-blue-100/50 text-blue-700' : 'bg-emerald-100/50 text-emerald-700'}`}>
            🥩 {recipe.proteinas}g Prot
          </span>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Ingredientes Principales</h3>
        <ul className="space-y-2 mb-4 flex-1">
          {recipe.ingredientes.slice(0, 3).map((ing, idx) => (
            <li key={idx} className="text-sm font-medium text-gray-600 flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
              <span className="truncate pr-2">{ing.nombre}</span>
              <span className="text-gray-400 whitespace-nowrap">{ing.cantidad} {ing.unidad}</span>
            </li>
          ))}
          {recipe.ingredientes.length > 3 && (
            <li className="text-xs font-bold text-gray-400 italic pt-1">
              + {recipe.ingredientes.length - 3} ingredientes más...
            </li>
          )}
        </ul>

        {/* Footer info */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div className="flex flex-wrap gap-1 flex-1 overflow-hidden h-[24px]">
            {recipe.aptoPara.slice(0, 2).map((apto, idx) => (
              <span key={idx} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-bold whitespace-nowrap">
                {apto}
              </span>
            ))}
            {recipe.aptoPara.length > 2 && (
              <span className="text-[10px] text-gray-400 font-medium px-1 py-1">...</span>
            )}
          </div>
          <div className="text-emerald-500 group-hover:translate-x-1 transition-transform">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};
