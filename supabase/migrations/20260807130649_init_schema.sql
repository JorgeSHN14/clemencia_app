-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC for User Registration
CREATE OR REPLACE FUNCTION registrar_usuario(
    p_nombres TEXT,
    p_apellidos TEXT,
    p_telefono TEXT,
    p_password_raw TEXT
) RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO usuarios (nombres, apellidos, telefono, password_hash)
    VALUES (
        p_nombres,
        p_apellidos,
        p_telefono,
        crypt(p_password_raw, gen_salt('bf'))
    ) RETURNING id INTO new_user_id;
    
    RETURN json_build_object('success', true, 'user_id', new_user_id);
EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'El número de teléfono ya está registrado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for User Login Verification
CREATE OR REPLACE FUNCTION verificar_login(
    p_telefono TEXT,
    p_password_raw TEXT
) RETURNS JSON AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT id, nombres, apellidos, telefono, password_hash, estado
    INTO user_record
    FROM usuarios
    WHERE telefono = p_telefono;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
    END IF;
    
    IF user_record.password_hash = crypt(p_password_raw, user_record.password_hash) THEN
        IF user_record.estado != 'ACTIVO' THEN
            RETURN json_build_object('success', false, 'error', 'Usuario inactivo');
        END IF;
        
        RETURN json_build_object(
            'success', true, 
            'user', json_build_object(
                'id', user_record.id,
                'nombres', user_record.nombres,
                'apellidos', user_record.apellidos,
                'telefono', user_record.telefono,
                'estado', user_record.estado
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'error', 'Contraseña incorrecta');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Table: alimentos
CREATE TABLE alimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cantidad_total NUMERIC DEFAULT 0,
    unidad TEXT NOT NULL,
    categoria TEXT NOT NULL,
    calorias_por_100g NUMERIC,
    proteinas_por_100g NUMERIC,
    grasas_por_100g NUMERIC,
    carbohidratos_por_100g NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: lotes
CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alimento_id UUID REFERENCES alimentos(id) ON DELETE CASCADE,
    fecha_ingreso DATE NOT NULL,
    fecha_vencimiento DATE,
    cantidad_original NUMERIC NOT NULL,
    cantidad_restante NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: movimientos_inventario
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alimento_id UUID REFERENCES alimentos(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad NUMERIC NOT NULL,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: pacientes
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    edad INTEGER NOT NULL,
    sexo TEXT NOT NULL CHECK (sexo IN ('M', 'F', 'Otro')),
    peso NUMERIC NOT NULL,
    talla NUMERIC NOT NULL,
    imc NUMERIC NOT NULL,
    porcentaje_grasa NUMERIC,
    circunferencia_cintura NUMERIC,
    circunferencia_cadera NUMERIC,
    diagnostico TEXT[] DEFAULT '{}',
    medicamentos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: recetas
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    procedimiento TEXT[] NOT NULL DEFAULT '{}',
    porciones NUMERIC NOT NULL,
    calorias NUMERIC NOT NULL,
    proteinas NUMERIC NOT NULL,
    macros_proteinas_porcentaje NUMERIC,
    macros_carbohidratos_porcentaje NUMERIC,
    macros_grasas_porcentaje NUMERIC,
    apto_para TEXT[] DEFAULT '{}',
    imagen_url TEXT,
    es_generada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: ingredientes_receta
CREATE TABLE ingredientes_receta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    cantidad NUMERIC NOT NULL,
    unidad TEXT NOT NULL,
    sustituto_sugerido TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE alimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes_receta ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (since we are not using Supabase Auth)
CREATE POLICY "Allow anonymous read all" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update all" ON usuarios FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert all" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete all" ON usuarios FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read all" ON alimentos FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update all" ON alimentos FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert all" ON alimentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete all" ON alimentos FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read all" ON lotes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update all" ON lotes FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert all" ON lotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete all" ON lotes FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read all" ON movimientos_inventario FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update all" ON movimientos_inventario FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert all" ON movimientos_inventario FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete all" ON movimientos_inventario FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read all" ON pacientes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update all" ON pacientes FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert all" ON pacientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete all" ON pacientes FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read all" ON recetas FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update all" ON recetas FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert all" ON recetas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete all" ON recetas FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read all" ON ingredientes_receta FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update all" ON ingredientes_receta FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert all" ON ingredientes_receta FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete all" ON ingredientes_receta FOR DELETE USING (true);
