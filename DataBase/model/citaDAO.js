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
    return await db.any("SELECT * FROM citasprogramadas WHERE idusuario=$1 and estatus='Activa' ORDER BY fecha, hora", [id]);
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
        FROM citasprogramadas c join usuario u ON c.idusuario = u.id where c.estatus = 'Activa' ORDER BY fecha, hora;
    `);
};

export const obtenerHorasOcupadas = async ({ fecha }) => {
    const rows = await db.any(
        "SELECT hora FROM citasprogramadas WHERE fecha = $1 AND estatus = 'Activa'",
        [fecha]
    );
    return rows.map(row => row.hora);
};


export const actualizarStatusCita = async (id, status) => {
    const result = await db.any(
        "UPDATE citasprogramadas SET estatus = $1 WHERE id = $2",
        [status, id]
    );
    return result;
};


export const actualizarCitasVencidas = async (fechaHoraActual) => {
    await db.any(
        "UPDATE citasprogramadas SET estatus = 'Terminada' WHERE estatus = 'Activa' AND (fecha < $1 OR (fecha = $1::date AND hora < $2))",
        [fechaHoraActual.toISOString().slice(0, 10), fechaHoraActual.toTimeString().slice(0, 5)]
    );
};

