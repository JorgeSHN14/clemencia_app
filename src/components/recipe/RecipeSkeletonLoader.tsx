import React from 'react';

export const RecipeSkeletonLoader: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
      <div className="bg-emerald-50 p-6 border-b border-emerald-100 flex flex-col items-center justify-center text-center space-y-3">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-emerald-600 animate-pulse">
            ✨
          </div>
        </div>
        <div>
          <h3 className="text-emerald-800 font-bold text-lg animate-pulse">Generando Menú Nutricional...</h3>
          <p className="text-emerald-600 text-xs font-medium animate-pulse opacity-80 mt-1">
            Consultando internet para valores nutricionales y combinándolos con el inventario.
          </p>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        <div>
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
            <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
            <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
          </div>
        </div>

        <div>
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6"></div>
            <div className="h-4 bg-gray-100 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
