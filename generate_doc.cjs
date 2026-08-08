const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType } = require('docx');
const fs = require('fs');

async function generateDoc() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 }
        }
      }
    },
    sections: [
      {
        properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        children: [
          // ====================================
          // PORTADA
          // ====================================
          new Paragraph({ spacing: { after: 600 } }),
          new Paragraph({ spacing: { after: 600 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'FUNDACIÓN CLEMENCIA', bold: true, size: 56, color: '047857', font: 'Calibri' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 24, color: '10B981' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: 'SISTEMA DE GESTIÓN NUTRICIONAL', bold: true, size: 40, color: '1F2937' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Manual de Usuario, Documentación Técnica', size: 28, color: '6B7280', italics: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: 'y Fundamentos de Dietoterapia Clínica', size: 28, color: '6B7280', italics: true })],
          }),
          new Paragraph({ spacing: { after: 600 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'CLEMENCIA APP v1.0', bold: true, size: 32, color: '047857' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Aplicación Web Progresiva (PWA)', size: 24, color: '6B7280' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [new TextRun({ text: `Fecha de generación: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`, size: 22, color: '9CA3AF' })],
          }),

          // ====================================
          // TABLA DE CONTENIDO
          // ====================================
          new Paragraph({ spacing: { before: 600 }, pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'TABLA DE CONTENIDO', bold: true, color: '047857' })] }),
          ...[
            '1. Visión General del Sistema',
            '2. Arquitectura y Tecnologías',
            '3. Módulo de Autenticación',
            '4. Módulo de Inventario y Bodega',
            '5. Módulo de Pacientes',
            '6. Módulo de Recetas e Inteligencia Artificial',
            '7. Módulo de Planificador de Menús',
            '8. Módulo de Intercambios Nutricionales',
            '9. Módulo de Guías y Protocolos (Dietoterapia y BPM)',
            '10. Fundamentos de Dietoterapia Clínica',
            '11. Esquema de Base de Datos (Supabase)',
            '12. Glosario de Términos',
          ].map(t => new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: t, size: 24, color: '374151' })] })),

          // ====================================
          // 1. VISIÓN GENERAL
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '1. VISIÓN GENERAL DEL SISTEMA', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [
            new TextRun({ text: 'Clemencia App ', bold: true }),
            new TextRun('es un sistema integral de gestión nutricional diseñado para instituciones de salud, hospitales, fundaciones y servicios de alimentación colectiva. Su objetivo principal es optimizar la administración de ingredientes, la creación de menús clínicos personalizados y el cumplimiento de protocolos de calidad alimentaria.'),
          ]}),
          new Paragraph({ spacing: { after: 200 }, children: [
            new TextRun('La aplicación permite controlar el inventario de alimentos en tiempo real, registrar fichas clínicas de pacientes con sus patologías, generar recetas ajustadas a restricciones médicas mediante '),
            new TextRun({ text: 'Inteligencia Artificial (Google Gemini)', bold: true }),
            new TextRun(', planificar menús semanales y consultar guías de Buenas Prácticas de Manufactura (BPM).'),
          ]}),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Características principales:', bold: true, size: 24 })] }),
          ...['Aplicación Web Progresiva (PWA): puede instalarse en cualquier dispositivo.', 'Datos 100% en la nube: sincronización en tiempo real con Supabase.', 'Interfaz moderna y responsiva: diseñada para uso en PC, tablet y celular.', 'Generación de recetas con IA: Google Gemini 2.5 Flash.', 'Gestión de imágenes y documentos: almacenamiento en Supabase Storage.', 'Sistema de autenticación seguro con control de sesiones.'].map(t => new Paragraph({ spacing: { after: 60 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),

          // ====================================
          // 2. ARQUITECTURA
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '2. ARQUITECTURA Y TECNOLOGÍAS', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('El sistema sigue una arquitectura moderna de cliente-servidor desacoplada donde el Frontend (la interfaz del usuario) se comunica directamente con el Backend-as-a-Service (BaaS) de Supabase a través de su SDK oficial.')] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Stack Tecnológico:', bold: true, size: 24 })] }),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: 'Frontend: ', bold: true }), new TextRun('React 18 + TypeScript + Vite (bundler ultrarrápido)')] }),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: 'Estilos: ', bold: true }), new TextRun('TailwindCSS 3 (framework de utilidades CSS)')] }),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: 'Estado Global: ', bold: true }), new TextRun('Zustand (stores reactivos y minimalistas)')] }),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: 'Navegación: ', bold: true }), new TextRun('React Router DOM v6')] }),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: 'Backend / BaaS: ', bold: true }), new TextRun('Supabase (PostgreSQL + Auth + Storage + RLS)')] }),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: 'IA Generativa: ', bold: true }), new TextRun('Google Gemini 2.5 Flash (@google/genai SDK)')] }),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: 'Hosting: ', bold: true }), new TextRun('Netlify (deploy automático con CI/CD)')] }),
          new Paragraph({ spacing: { after: 200 }, indent: { left: 400 }, children: [new TextRun({ text: 'PWA: ', bold: true }), new TextRun('Vite PWA Plugin con Service Worker')] }),

          // ====================================
          // 3. AUTENTICACIÓN
          // ====================================
          new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '3. MÓDULO DE AUTENTICACIÓN', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('El sistema cuenta con un módulo de inicio de sesión y registro de usuarios. Al acceder a la URL de la aplicación, los usuarios no autenticados son redirigidos automáticamente a la pantalla de Login. Las credenciales se almacenan de forma segura en Supabase Auth.')] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Funcionalidades:', bold: true })] }),
          ...['Registro de nuevos usuarios (nombres, apellidos, teléfono, correo, contraseña).', 'Inicio de sesión por correo electrónico y contraseña.', 'Persistencia de sesión: el usuario permanece autenticado hasta que cierre sesión explícitamente (usando Zustand con middleware persist).', 'Protección de rutas: las páginas internas solo son accesibles tras autenticarse (componente ProtectedRoute).', 'Botón de "Cerrar Sesión" disponible en el sidebar (desktop) y en el header (móvil).'].map(t => new Paragraph({ spacing: { after: 60 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Tablas involucradas: ', bold: true }), new TextRun('usuarios (Supabase Auth + tabla personalizada).')] }),

          // ====================================
          // 4. INVENTARIO
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '4. MÓDULO DE INVENTARIO Y BODEGA', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Este módulo permite gestionar el stock de alimentos e insumos del servicio de alimentación. Cada alimento registrado contiene información nutricional opcional (calorías, proteínas, grasas y carbohidratos por cada 100g) y se clasifica en categorías alimentarias estándar.')] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Opciones disponibles:', bold: true })] }),
          ...['Registrar Entrada (compra/ingreso de mercancía): Se abre un formulario donde se selecciona o crea el alimento, se indica la cantidad, unidad de medida, fecha de vencimiento del lote y categoría alimentaria.', 'Registrar Salida (consumo/uso): Se descuenta stock de los lotes existentes. El sistema valida que no se pueda sacar más de lo disponible.', 'Acción Rápida (botones + y - en cada tarjeta): Permite hacer entradas o salidas express sin abrir el formulario completo.', 'Ver Kardex / Historial: Cada alimento tiene un botón de "historial" que muestra todas las transacciones (entradas y salidas) ordenadas cronológicamente.', 'Eliminar producto: Borra el alimento y todo su historial del sistema.', 'Búsqueda y filtrado: Se puede buscar por nombre y filtrar por categoría alimentaria (Cereales, Frutas, Vegetales, Lácteos, etc.).', 'Alerta de vencimiento: El sistema identifica productos con lotes próximos a caducar y muestra un contador visible en el encabezado.'].map(t => new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Inteligencia Anti-Duplicados:', bold: true })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('El sistema implementa un algoritmo de detección de singulares y plurales en español. Si ya existe "Manzana" en la base de datos y alguien intenta crear "Manzanas", el sistema lo detecta automáticamente y reutiliza el registro existente. Esto previene la fragmentación de datos.')] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Tablas involucradas: ', bold: true }), new TextRun('alimentos, lotes, transacciones (todas en Supabase).')] }),

          // ====================================
          // 5. PACIENTES
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '5. MÓDULO DE PACIENTES', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Este módulo permite crear y administrar las fichas clínicas de cada paciente o comensal. Es la base para la personalización de dietas y la integración con el generador de recetas por IA.')] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Datos que se registran por paciente:', bold: true })] }),
          ...['Nombre completo, edad, sexo (Masculino, Femenino, Otro).', 'Peso (kg), Talla (m) → el IMC se calcula automáticamente en tiempo real.', 'Mediciones antropométricas opcionales: porcentaje de grasa corporal, circunferencia de cintura (cm), circunferencia de cadera (cm).', 'Diagnósticos clínicos: selección múltiple de patologías (Diabetes, Hipertensión, Disfagia, Enfermedad Renal, Dieta Blanda, etc.). Las opciones se cargan dinámicamente desde la tabla "sintomatologias" de Supabase.', 'Lista de medicamentos: campo de texto libre para agregar cada medicamento que toma el paciente, con opción de eliminar individualmente.'].map(t => new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Opciones disponibles:', bold: true })] }),
          ...['Añadir Paciente: Abre un formulario modal con campos organizados en dos columnas.', 'Editar Paciente: Pre-carga todos los datos del paciente en el formulario para su modificación.', 'Eliminar Paciente: Borra la ficha del sistema.', 'Indicador visual de IMC: Cada tarjeta tiene una barra lateral de color que indica el estado nutricional (verde = normal, naranja = bajo peso, amarillo = sobrepeso, rojo = obesidad).'].map(t => new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Tablas involucradas: ', bold: true }), new TextRun('pacientes, sintomatologias (ambas en Supabase).')] }),

          // ====================================
          // 6. RECETAS E IA
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '6. MÓDULO DE RECETAS E INTELIGENCIA ARTIFICIAL', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Este módulo combina un recetario clásico con un motor de generación de recetas basado en Inteligencia Artificial. Es el corazón de la aplicación.')] }),

          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '6.1. Recetario (Vista Principal)', bold: true, size: 26 })] }),
          ...['Visualización en cuadrícula (grid) de todas las recetas almacenadas.', 'Barra de búsqueda por título o nombre de ingrediente.', 'Filtro por origen: "Recetas Base" (creadas manualmente) o "Generadas por IA".', 'Filtro por patología compatible (Diabetes, Hipertensión, etc.).', 'Vista de detalle a pantalla completa al hacer clic en cualquier receta.', 'Eliminación de recetas generadas por IA (las recetas base no pueden borrarse desde la interfaz).'].map(t => new Paragraph({ spacing: { after: 60 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: '6.2. Generador de Recetas con IA (Google Gemini)', bold: true, size: 26 })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('La generación se realiza en dos pasos guiados:')] }),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: 'Paso 1 – Seleccionar Patologías Clínicas: ', bold: true }), new TextRun('El usuario marca las restricciones médicas que la receta debe respetar (ej. Hipertensión → la IA evita usar exceso de sodio).')] }),
          new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: 'Paso 2 – Carrito de Ingredientes: ', bold: true }), new TextRun('El usuario selecciona ingredientes del inventario de bodega (con información nutricional) o escribe ingredientes personalizados.')] }),
          new Paragraph({ spacing: { after: 200 }, indent: { left: 400 }, children: [new TextRun({ text: 'Generación: ', bold: true }), new TextRun('Se envía un prompt estricto a Google Gemini 2.5 Flash solicitando únicamente un JSON con: título, ingredientes (nombre, cantidad, unidad), procedimiento detallado paso a paso, porciones, calorías totales y proteínas. La respuesta se parsea, se valida y se muestra al usuario.')] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Flujo técnico de la IA:', bold: true })] }),
          ...['Se instancia el cliente @google/genai con la API Key almacenada en .env (VITE_GEMINI_API_KEY).', 'Se envía el prompt con temperatura=1, maxOutputTokens=8192, topP=0.95 y herramienta de Google Search habilitada.', 'La respuesta cruda de Gemini se limpia de bloques markdown (```json ... ```).', 'Se extrae el objeto JSON y se parsea con JSON.parse().', 'La receta parseada se muestra en una vista de detalle con opciones de Guardar, Regenerar o Descartar.', 'Al guardar, se insertan los datos en las tablas "recetas" e "ingredientes_receta" de Supabase.'].map(t => new Paragraph({ spacing: { after: 60 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Tablas involucradas: ', bold: true }), new TextRun('recetas, ingredientes_receta (Supabase).')] }),

          // ====================================
          // 7. MENÚS
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '7. MÓDULO DE PLANIFICADOR DE MENÚS', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Este módulo genera automáticamente una planificación semanal de menús (Desayuno, Almuerzo, Cena) para los 7 días de la semana, distribuyendo las recetas disponibles en el recetario de forma cíclica.')] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Opciones disponibles:', bold: true })] }),
          ...['Selector de día: Botones tipo "pill" para navegar entre Lunes y Domingo.', 'Tarjetas por comida: Cada tarjeta muestra el tipo de comida (Desayuno/Almuerzo/Cena), título de la receta asignada, calorías y proteínas.', 'Indicador de stock: El sistema verifica en tiempo real si los ingredientes de cada receta están disponibles en el inventario. Si faltan ingredientes, aparece una alerta naranja "Faltan ingredientes"; si todo está disponible, muestra un check verde "Stock Completo".', 'Vista de detalle: Al hacer clic en cualquier tarjeta se abre la receta completa con el procedimiento paso a paso.'].map(t => new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Fuente de datos: ', bold: true }), new TextRun('Se alimenta de las tablas recetas e ingredientes_receta + alimentos (para verificación de stock).')] }),

          // ====================================
          // 8. INTERCAMBIOS
          // ====================================
          new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '8. MÓDULO DE INTERCAMBIOS NUTRICIONALES', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('El módulo de intercambios permite al equipo de nutrición gestionar una tabla de equivalencias alimentarias. Cada "intercambio" indica qué porción de un alimento es nutricionalmente equivalente a otra, facilitando la sustitución cuando un ingrediente no está disponible.')] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Opciones disponibles:', bold: true })] }),
          ...['Añadir intercambio: Formulario con campos de nombre, grupo alimentario y porción equivalente.', 'Filtrado por grupo: Cereales, Tubérculos, Proteínas, Frutas, Vegetales.', 'Búsqueda por nombre.', 'Eliminar intercambio.'].map(t => new Paragraph({ spacing: { after: 60 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Tabla involucrada: ', bold: true }), new TextRun('intercambios (Supabase).')] }),

          // ====================================
          // 9. GUÍAS Y BPM
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '9. MÓDULO DE GUÍAS Y PROTOCOLOS', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Este módulo sirve como un manual de consulta rápida digitalizado para el equipo de cocina y nutrición. Está dividido en dos secciones principales:')] }),

          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '9.1. Dietoterapia Clínica', bold: true, size: 26 })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Presenta información en formato de lista desplegable (acordeón). Contiene definiciones de términos médicos, lineamientos de dietas especiales (líquida clara, blanda, hiposódica, hipocalórica, para diabéticos) y conceptos de nutrición clínica. Si la guía tiene imágenes, se muestran dentro del acordeón al expandirlo.')] }),

          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '9.2. Normas BPM (Buenas Prácticas de Manufactura)', bold: true, size: 26 })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Presenta información en formato de tarjetas visuales organizadas en una cuadrícula de 2 columnas, estilo "red social". Ideal para mostrar infografías de procedimientos como lavado de manos, control de temperaturas, manipulación de alimentos, etc.')] }),

          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Funcionalidades especiales:', bold: true })] }),
          ...['Botón "Añadir Norma": Abre un formulario modal para crear nuevos protocolos.', 'Soporte de múltiples imágenes: Se pueden subir varias imágenes a la vez desde el explorador de archivos.', 'Soporte de portapapeles (Ctrl+V): Se pueden pegar capturas de pantalla directamente sin necesidad de guardarlas antes como archivo.', 'Campo de enlace opcional: Si se agrega una URL, aparece un botón "Abrir Enlace de Referencia" en la visualización.', 'Visor de pantalla completa: Al hacer clic en cualquier imagen, se abre un visor con fondo oscuro para examinarla en detalle.', 'Las imágenes se almacenan en Supabase Storage en el bucket "guide_images".'].map(t => new Paragraph({ spacing: { after: 80 }, indent: { left: 400 }, children: [new TextRun({ text: '• ' + t, size: 22 })] })),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Tablas involucradas: ', bold: true }), new TextRun('guias (Supabase DB) + guide_images (Supabase Storage Bucket).')] }),

          // ====================================
          // 10. DIETOTERAPIA
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '10. FUNDAMENTOS DE DIETOTERAPIA CLÍNICA', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('A continuación se presentan los conceptos nutricionales fundamentales que maneja la aplicación y que son relevantes para la correcta operación del servicio de alimentación institucional.')] }),

          ...[
            { title: 'Disfagia', text: 'Dificultad para tragar alimentos sólidos o líquidos. En entorno hospitalario requiere modificación de texturas (uso de espesantes, dietas trituradas tipo puré) para evitar la broncoaspiración.' },
            { title: 'Nutrición Enteral y Parenteral', text: 'Nutrición Enteral (NE): alimentación administrada directamente al tracto gastrointestinal a través de una sonda. Nutrición Parenteral (NP): alimentación administrada directamente al torrente sanguíneo vía intravenosa.' },
            { title: 'Sarcopenia', text: 'Pérdida degenerativa de masa muscular causada por envejecimiento o inmovilización prolongada. El enfoque nutricional exige alto aporte de proteínas de alto valor biológico.' },
            { title: 'Dieta Líquida Clara', text: 'Indicada para preparación pre-quirúrgica o primer paso en tolerancia oral post-operatoria. Incluye: agua, caldos desgrasados colados, té, gelatinas, jugos colados sin pulpa. Prohibido: lácteos, jugos con pulpa, alimentos sólidos.' },
            { title: 'Dieta Blanda', text: 'Indicada para dificultad para masticar, transición post-líquida, gastritis. Incluye: carnes tiernas o molidas, pescados blancos, vegetales cocidos, arroz muy cocido, frutas en compota. Prohibido: fritos, picantes, vegetales crudos, granos enteros.' },
            { title: 'Dieta Hiposódica', text: 'Indicada para hipertensión arterial, insuficiencia cardíaca, enfermedad renal. Límite de sodio: 1500mg-2000mg/día. Prohibido: embutidos, enlatados, caldos concentrados, salsas comerciales.' },
            { title: 'Dieta para Diabéticos', text: 'Indicada para Diabetes Mellitus tipo 1 y 2. Distribución fraccionada de carbohidratos complejos con bajo índice glucémico. Prohibido: azúcar refinada, panela, miel, jugos colados puros, dulces.' },
            { title: 'Índice de Masa Corporal (IMC)', text: 'Fórmula: peso(kg) / talla(m)². Clasificación: <18.5 Bajo peso, 18.5-24.9 Normal, 25-29.9 Sobrepeso, ≥30 Obesidad. La app lo calcula en tiempo real al registrar un paciente.' },
          ].flatMap(item => [
            new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: item.title, bold: true, size: 24, color: '1F2937' })] }),
            new Paragraph({ spacing: { after: 100 }, indent: { left: 200 }, children: [new TextRun({ text: item.text, size: 22 })] }),
          ]),

          // ====================================
          // 11. ESQUEMA DE BASE DE DATOS
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '11. ESQUEMA DE BASE DE DATOS (SUPABASE)', bold: true, color: '047857' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Todas las tablas residen en una instancia de Supabase (PostgreSQL gestionado). A continuación se listan las tablas principales y sus columnas más relevantes:')] }),

          ...[
            { name: 'usuarios', cols: 'id (UUID), nombres, apellidos, telefono, password_hash, estado, created_at' },
            { name: 'alimentos', cols: 'id (UUID), nombre, cantidad_total, unidad, categoria, calorias_por_100g, proteinas_por_100g, grasas_por_100g, carbohidratos_por_100g' },
            { name: 'lotes', cols: 'id (UUID), alimento_id (FK), fecha_ingreso, fecha_vencimiento, cantidad_original, cantidad_restante' },
            { name: 'transacciones', cols: 'id (UUID), alimento_id (FK), lote_id (FK), tipo (ENTRADA/SALIDA/AJUSTE), cantidad, motivo, fecha' },
            { name: 'pacientes', cols: 'id (UUID), nombre, edad, sexo, peso, talla, imc, porcentaje_grasa, circunferencia_cintura, circunferencia_cadera, diagnostico (TEXT[]), medicamentos (TEXT[])' },
            { name: 'sintomatologias', cols: 'id (UUID), nombre' },
            { name: 'recetas', cols: 'id (UUID), titulo, procedimiento (TEXT[]), porciones, calorias, proteinas, macros_*, apto_para (TEXT[]), imagen_url, es_generada (BOOLEAN)' },
            { name: 'ingredientes_receta', cols: 'id (UUID), receta_id (FK), nombre, cantidad, unidad, sustituto_sugerido' },
            { name: 'intercambios', cols: 'id (UUID), nombre, grupo, porciones_equivalentes' },
            { name: 'guias', cols: 'id (UUID), tipo (clinica/bpm), titulo, contenido, imagenes_urls (TEXT[]), enlace_url, created_at' },
          ].flatMap(t => [
            new Paragraph({ spacing: { before: 100, after: 40 }, children: [new TextRun({ text: `Tabla: ${t.name}`, bold: true, size: 24, color: '047857' })] }),
            new Paragraph({ spacing: { after: 100 }, indent: { left: 200 }, children: [new TextRun({ text: t.cols, size: 20, color: '4B5563' })] }),
          ]),
          new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun({ text: 'Bucket de Storage: ', bold: true }), new TextRun('guide_images (público, para las infografías de BPM y Dietoterapia).')] }),

          // ====================================
          // 12. GLOSARIO
          // ====================================
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: '12. GLOSARIO DE TÉRMINOS', bold: true, color: '047857' })] }),
          ...[
            { term: 'PWA', def: 'Progressive Web Application. Aplicación web que puede instalarse en el dispositivo como si fuera nativa.' },
            { term: 'Supabase', def: 'Plataforma Backend-as-a-Service de código abierto basada en PostgreSQL.' },
            { term: 'RLS', def: 'Row Level Security. Sistema de permisos a nivel de fila en PostgreSQL.' },
            { term: 'Zustand', def: 'Librería de estado global para React, minimalista y reactiva.' },
            { term: 'Gemini', def: 'Modelo de Inteligencia Artificial Generativa de Google DeepMind.' },
            { term: 'BPM', def: 'Buenas Prácticas de Manufactura. Estándares de higiene y seguridad alimentaria.' },
            { term: 'IMC', def: 'Índice de Masa Corporal. Indicador que relaciona peso y estatura.' },
            { term: 'Kardex', def: 'Registro cronológico de movimientos de entrada y salida de un producto.' },
            { term: 'NE', def: 'Nutrición Enteral. Alimentación a través de sonda directamente al tracto gastrointestinal.' },
            { term: 'NP', def: 'Nutrición Parenteral. Alimentación intravenosa que evita el sistema digestivo.' },
            { term: 'Bucket', def: 'Contenedor de almacenamiento de archivos en la nube (Supabase Storage).' },
          ].map(g => new Paragraph({ spacing: { after: 80 }, indent: { left: 200 }, children: [new TextRun({ text: `${g.term}: `, bold: true, size: 22 }), new TextRun({ text: g.def, size: 22 })] })),

          // ====================================
          // PIE DE PÁGINA
          // ====================================
          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 20, color: '10B981' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Documento generado automáticamente por Clemencia App', size: 20, color: '9CA3AF', italics: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '© 2026 Fundación Clemencia. Todos los derechos reservados.', size: 20, color: '9CA3AF' })],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('documentacion_clemenciaapp.docx', buffer);
  console.log('✅ Archivo .docx generado exitosamente: documentacion_clemenciaapp.docx');
}

generateDoc().catch(console.error);
