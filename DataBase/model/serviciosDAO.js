import db from '../db.js';

export const obtenerServicios = async () => {
    return await db.any("SELECT * FROM servicios");
};
