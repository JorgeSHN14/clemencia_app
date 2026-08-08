import { GoogleGenAI } from '@google/genai';
import type { CondicionClinica, Receta } from '@/types';

export interface GenerarRecetaParams {
  inventarioDisponible: string[];
  patologias: CondicionClinica[];
}

export const generarRecetaIA = async (params: GenerarRecetaParams): Promise<Receta> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API Key no configurada en el archivo .env (VITE_GEMINI_API_KEY).');
  }

  // Instanciamos el cliente oficial usando el formato que proveíste
  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  const promptText = `DEVUELVE ÚNICAMENTE EL CÓDIGO JSON. CERO TEXTO CONVERSACIONAL ANTES O DESPUÉS. PROHIBIDO SALUDAR O EXPLICAR.
Crea receta en JSON estricto. Usa ingredientes: ${params.inventarioDisponible.join(', ')}. Cumple restricciones: ${params.patologias.join(', ')}.
Los pasos deben ser muy detallados. NO uses prefijos como "Paso 1:" ni números en el procedimiento. Redacta solo la acción. Busca valores nutricionales precisos.
Formato:
{"titulo":"","ingredientes":[{"nombre":"","cantidad":100,"unidad":""}],"procedimiento":["Detalle de la accion","Siguiente accion"],"porciones":2,"calorias":350,"proteinas":25}`;

  // Configuración adaptada a tu formato
  const generationConfig = {
    temperature: 1,
    maxOutputTokens: 8192,
    topP: 0.95,
  };

  try {
    // Usamos el método generateContent que es la adaptación directa para obtener texto JSON
    console.log("----- ENVIANDO PETICIÓN A GEMINI -----");
    console.log(promptText);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        ...generationConfig,
        tools: [{ googleSearch: {} }],
      }
    });

    let rawText = response.text || '';
    
    console.log("----- RESPUESTA CRUDA DE GEMINI -----");
    console.log(rawText);
    
    // Limpiamos los bloques de código markdown que Gemini a veces añade
    rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extraemos solo la parte que contiene el JSON en caso de que la IA responda con texto extra
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      rawText = rawText.substring(jsonStart, jsonEnd + 1);
    }

    try {
      const receta = JSON.parse(rawText);
      return {
        id: crypto.randomUUID(),
        titulo: receta.titulo,
        ingredientes: receta.ingredientes,
        procedimiento: receta.procedimiento,
        porciones: receta.porciones,
        calorias: receta.calorias,
        proteinas: receta.proteinas,
        aptoPara: params.patologias.filter(p => p !== 'Ninguna'),
      } as Receta;
    } catch (parseError) {
      console.error("Error parseando JSON de Gemini:", rawText);
      throw new Error('La IA no retornó un JSON válido.');
    }

  } catch (error: any) {
    console.error("Error en petición a GoogleGenAI:", error);
    throw new Error(error.message || 'Error al conectar con Gemini 2.5 Flash Lite.');
  }
};
