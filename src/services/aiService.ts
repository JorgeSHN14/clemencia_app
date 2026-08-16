import { GoogleGenAI } from '@google/genai';
import type { CondicionClinica, Receta } from '@/types';

export interface GenerarRecetaParams {
  inventarioDisponible: string[];
  patologias: CondicionClinica[];
  porciones: number;
  ingredientesExtra?: string[];
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

  const promptText = `DEVUELVE ÚNICAMENTE EL CÓDIGO JSON. CERO TEXTO CONVERSACIONAL ANTES O DESPUÉS.
Eres el Nutricionista Clínico Jefe de un hospital de alta especialidad. Tu tarea es diseñar una receta terapéutica impecable aplicando los estándares internacionales de dietoterapia más rigurosos (ADA, ESPEN, ASPEN, etc.) para la siguiente condición clínica: ${params.patologias.join(', ')}.

IMPORTANTE: La receta debe estar calculada EXACTAMENTE para ${params.porciones} porciones/personas.

INVENTARIO DISPONIBLE EN STOCK (Prioriza estos ingredientes):
${params.inventarioDisponible.join(';\n')}

${params.ingredientesExtra && params.ingredientesExtra.length > 0 ? `INGREDIENTES EXTRA PERMITIDOS (Puedes usar estos si es necesario para completar la receta, aunque no estén en stock): \n${params.ingredientesExtra.join(', ')}` : ''}

REGLAS ESTRICTAS:
1. SOLO usa los ingredientes proporcionados en el INVENTARIO o en los INGREDIENTES EXTRA. NO inventes sal, agua o aceite si no están en la lista (asume que el paciente solo puede comer lo que hay aquí).
2. Toma decisiones clínicas brillantes. Si la condición médica prohíbe un alimento, NO LO USES bajo ninguna circunstancia.
3. El inventario incluye el stock máximo disponible. Intenta no pasarte de ese stock si es posible, pero si las ${params.porciones} porciones lo requieren estrictamente, puedes pasarte.
4. Cantidades y unidades: Expresa la "cantidad" en la "unidad" original del ingrediente. ADEMÁS, estima OBLIGATORIAMENTE el "peso_en_gramos" aproximado de esa cantidad. Si la unidad original ya es 'g' o 'ml', el peso_en_gramos debe ser el mismo número.
5. PROCEDIMIENTO UNIVERSAL: Los pasos de preparación NO DEBEN INCLUIR NÚMEROS O CANTIDADES EXACTAS (ej: prohibido decir "agrega 100g de harina", en su lugar di "agrega la harina"). Esto es porque el sistema escalará las cantidades dinámicamente y el texto no debe perder sentido.
6. NO calcules calorías ni macronutrientes. Eso lo haremos matemáticamente nosotros en el sistema.

Formato JSON obligatorio:
{
  "titulo": "Nombre de la Receta",
  "ingredientes": [
    {
      "id_inventario": "ID_DEL_INGREDIENTE_AQUI (vacío si es ingrediente extra)",
      "nombre": "Nombre del ingrediente",
      "cantidad": 1,
      "unidad": "unidades",
      "peso_en_gramos": 150,
      "esExtra": false
    }
  ],
  "procedimiento": ["Picar finamente los ingredientes...", "Hervir..."],
  "porciones": ${params.porciones}
}`;

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
        calorias: 0, // Se calculará en el frontend
        proteinas: 0, // Se calculará en el frontend
        carbohidratos: 0, // Se calculará en el frontend
        grasas: 0, // Se calculará en el frontend
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
