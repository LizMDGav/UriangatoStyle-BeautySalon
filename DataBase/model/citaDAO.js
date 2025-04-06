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

export const obtenerCitasId = async ({id}) => {
    return await db.any("SELECT * FROM citasprogramadas WHERE idusuario=$1 ORDER BY fecha, hora", [id]);
};
