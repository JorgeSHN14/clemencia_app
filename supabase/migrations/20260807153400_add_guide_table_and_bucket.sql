-- 1. Create the guias table
CREATE TABLE guias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('clinica', 'bpm')),
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS and setup policies for guias
ALTER TABLE guias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read all" ON guias FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert all" ON guias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete all" ON guias FOR DELETE USING (true);
CREATE POLICY "Allow anonymous update all" ON guias FOR UPDATE USING (true);

-- 3. Create the storage bucket for guide images
INSERT INTO storage.buckets (id, name, public) VALUES ('guide_images', 'guide_images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS for the bucket objects
-- Allow public access to read the images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'guide_images');

-- Allow anonymous uploads to the bucket
CREATE POLICY "Anonymous Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'guide_images');

-- Allow anonymous deletes (optional, but good for cleanup)
CREATE POLICY "Anonymous Deletes" ON storage.objects FOR DELETE USING (bucket_id = 'guide_images');
