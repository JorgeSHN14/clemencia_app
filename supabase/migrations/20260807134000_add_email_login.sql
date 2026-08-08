-- Modificar la tabla usuarios para usar email en lugar de telefono
ALTER TABLE usuarios 
  RENAME COLUMN telefono TO email;

-- Actualizar la función registrar_usuario
DROP FUNCTION IF EXISTS registrar_usuario(TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION registrar_usuario(
    p_nombres TEXT,
    p_apellidos TEXT,
    p_email TEXT,
    p_password_raw TEXT
) RETURNS json AS $$
DECLARE
    v_user_id UUID;
BEGIN
    INSERT INTO usuarios (nombres, apellidos, email, password_hash)
    VALUES (
        p_nombres,
        p_apellidos,
        p_email,
        crypt(p_password_raw, gen_salt('bf'))
    )
    RETURNING id INTO v_user_id;

    RETURN json_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'El email ya está registrado.');
WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar la función verificar_login
DROP FUNCTION IF EXISTS verificar_login(TEXT, TEXT);
CREATE OR REPLACE FUNCTION verificar_login(
    p_email TEXT,
    p_password_raw TEXT
) RETURNS json AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT id, nombres, apellidos, email, password_hash, estado
    INTO user_record
    FROM usuarios
    WHERE email = p_email;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Credenciales inválidas');
    END IF;

    IF user_record.estado != 'activo' THEN
        RETURN json_build_object('success', false, 'error', 'Cuenta inactiva');
    END IF;

    IF user_record.password_hash = crypt(p_password_raw, user_record.password_hash) THEN
        RETURN json_build_object(
            'success', true,
            'user', json_build_object(
                'id', user_record.id,
                'nombres', user_record.nombres,
                'apellidos', user_record.apellidos,
                'email', user_record.email,
                'estado', user_record.estado
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'error', 'Credenciales inválidas');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
