import db from '../db.js';
import bcrypt from 'bcrypt';

export const agregarCita = async ({ idUsuario, servicio, idSede, telefono,
    correo, fecha, hora, costo, estatus, domicilio
}) => {
    return await db.one(
        `INSERT INTO citasprogramadas 
        (idusuario, servicio, idsede, telefono, correo, fecha, hora, costo, estatus, domicilio) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING id`,
        [idUsuario, servicio, idSede, telefono, correo, fecha, hora, costo, estatus, domicilio]
    );
};

export const obtenerCitasId = async ({ id }) => {
    return await db.any("SELECT * FROM citasprogramadas WHERE idusuario=$1 ORDER BY fecha, hora", [id]);
};


export const obtenerTodasLasCitas = async () => {
    return await db.any(`
        SELECT 
            u.usuario, 
            u.nombre_completo,
            c.id,
            c.idusuario,
            c.servicio,
            c.idsede,
            c.telefono,
            c.correo,
            c.fecha,
            c.hora,
            c.costo,
            c.estatus,
            c.domicilio
        FROM citasprogramadas c join usuario u ON c.idusuario = u.id ORDER BY fecha, hora;
    `);
};
