-- MIGRACIÓN: 012 - INCLUIR ETIQUETAS EN OBTENCIÓN DE ENTIDAD
-- Autor: Antigravity
CREATE OR REPLACE FUNCTION fn_crm_get_entity(p_id UUID) RETURNS JSONB AS $$
DECLARE v_entity JSONB;
BEGIN
SELECT jsonb_build_object(
        'id',
        e.id,
        'nombre_legal',
        e.nombre_legal,
        'slug',
        e.slug,
        'descripcion',
        e.descripcion,
        'razon_social',
        e.razon_social,
        'cuit',
        e.cuit,
        'tipo_entidad',
        e.tipo_entidad,
        'activa',
        e.activa,
        'validation_score',
        e.validation_score,
        'created_at',
        e.fecha_creacion,
        'updated_at',
        e.fecha_actualizacion,
        'manager_id',
        e.manager_id,
        'telefonos',
        (
            SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id',
                            t.id,
                            'numero',
                            t.numero,
                            'tipo',
                            t.tipo_telefonico,
                            'uso',
                            t.tipo_uso,
                            'validado',
                            t.validado
                        )
                    ),
                    '[]'::jsonb
                )
            FROM telefonos t
            WHERE t.entidad_id = e.id
        ),
        'emails',
        (
            SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id',
                            em.id,
                            'email',
                            em.email,
                            'uso',
                            em.tipo_uso,
                            'validado',
                            em.validado
                        )
                    ),
                    '[]'::jsonb
                )
            FROM emails em
            WHERE em.entidad_id = e.id
        ),
        'direcciones',
        (
            SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id',
                            d.id,
                            'calle',
                            d.calle,
                            'numero',
                            d.numero,
                            'localidad',
                            d.localidad,
                            'provincia',
                            d.provincia,
                            'tipo',
                            d.tipo_direccion,
                            'lat',
                            d.latitude,
                            'lng',
                            d.longitude,
                            'validada',
                            d.validada
                        )
                    ),
                    '[]'::jsonb
                )
            FROM direcciones d
            WHERE d.entidad_id = e.id
        ),
        'websites',
        (
            SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id',
                            w.id,
                            'url',
                            w.url,
                            'tipo',
                            w.tipo_sitio,
                            'validado',
                            w.validado
                        )
                    ),
                    '[]'::jsonb
                )
            FROM sitios_web w
            WHERE w.entidad_id = e.id
        ),
        'socials',
        (
            SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id',
                            s.id,
                            'plataforma',
                            s.plataforma,
                            'url',
                            s.usuario_o_url,
                            'validada',
                            s.validada
                        )
                    ),
                    '[]'::jsonb
                )
            FROM redes_sociales s
            WHERE s.entidad_id = e.id
        ),
        'categorias',
        (
            SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id',
                            c.id,
                            'nombre',
                            c.nombre,
                            'slug',
                            c.slug,
                            'es_primaria',
                            ec.es_primaria
                        )
                    ),
                    '[]'::jsonb
                )
            FROM entidad_categorias ec
                JOIN categorias c ON ec.categoria_id = c.id
            WHERE ec.entidad_id = e.id
        ),
        'etiquetas',
        (
            SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id',
                            et.id,
                            'nombre',
                            et.nombre,
                            'tipo',
                            et.tipo,
                            'color_hex',
                            et.color_hex,
                            'icono',
                            et.icono
                        )
                    ),
                    '[]'::jsonb
                )
            FROM entidad_etiquetas ee
                JOIN etiquetas et ON ee.etiqueta_id = et.id
            WHERE ee.entidad_id = e.id
        )
    ) INTO v_entity
FROM entidades e
WHERE e.id = p_id;
RETURN v_entity;
END;
$$ LANGUAGE plpgsql;