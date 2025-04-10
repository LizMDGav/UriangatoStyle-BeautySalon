import db from '../db.js';

export const obtenerServicios = async () => {
    return await db.any("SELECT * FROM servicios ORDER BY id");
};

export const agregarServicio = async ({ nombre, descripcion, costo, descuento, imagen, categoria }) => {
    return await db.one(
        `INSERT INTO servicios 
        (nombre, descripcion, costo, descuento, imagen, categoria) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [nombre, descripcion, costo, descuento, imagen, categoria]
    );
};

export const actualizarServicio = async ({ id, nombre, descripcion, costo, descuento, imagen, categoria }) => {
    if (imagen == null) {
        return await db.one(
            `UPDATE servicios SET
            nombre = $2,
            descripcion = $3,
            costo = $4,
            descuento = $5,
            categoria = $7
            WHERE id = $1
            RETURNING *`,
            [id, nombre, descripcion, costo, descuento, imagen, categoria]
        );
    } else {
        return await db.one(
            `UPDATE servicios SET
        nombre = $2,
        descripcion = $3,
        costo = $4,
        descuento = $5,
        imagen = $6,
        categoria = $7
        WHERE id = $1
        RETURNING *`,
            [id, nombre, descripcion, costo, descuento, imagen, categoria]
        );
    }

};

export const eliminarServicio = async (id) => {
    return await db.result(
        "DELETE FROM servicios WHERE id = $1",
        [id]
    );
};

export const serviciosCabello = async () => {
    return await db.any("SELECT * FROM servicios WHERE categoria = 'cabello'");
};

export const serviciosEyelashes = async () => {
    return await db.any("SELECT * FROM servicios WHERE categoria = 'pestañas'");
};


export const serviciosMaqPein = async () => {
    return await db.any("SELECT * FROM servicios WHERE categoria = 'peinado y maquillaje'");
};

export const promociones = async () => {
    return await db.any("SELECT * FROM servicios WHERE descuento > 0");
};


export const obtenerServiciosPopulares = async () => {
    return await db.any(`
        SELECT s.id AS servicio_id, s.nombre, s.costo, s.imagen, s.descuento, COUNT(*) AS cantidad_agendado
        FROM citasprogramadas c
        JOIN servicios s ON c.servicio = s.nombre 
        GROUP BY s.id, s.nombre
        ORDER BY cantidad_agendado DESC
        LIMIT 4
    `);
};

