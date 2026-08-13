-- Add grupo_alimento column to alimentos table
ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS grupo_alimento TEXT;
