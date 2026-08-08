-- Script para eliminar la tabla vieja y crear la nueva con soporte de múltiples imágenes
DROP TABLE IF EXISTS guias;

-- Crear tabla para las Guías y Normas BPM (Múltiples Imágenes)
CREATE TABLE guias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('clinica', 'bpm')),
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    imagenes_urls TEXT[] DEFAULT '{}',
    enlace_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar permisos (RLS)
ALTER TABLE guias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read all" ON guias FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert all" ON guias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete all" ON guias FOR DELETE USING (true);
CREATE POLICY "Allow anonymous update all" ON guias FOR UPDATE USING (true);
