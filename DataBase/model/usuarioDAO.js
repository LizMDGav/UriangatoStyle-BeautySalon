import db from '../db.js';
import bcrypt from 'bcrypt';



export const agregarUsuario = async ({ nombreCompleto, correo_electronico, usuario, password }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return await db.one(
        `INSERT INTO usuario 
        (nombre_completo, correo_electronico, usuario, password) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, usuario, correo_electronico`,
        [nombreCompleto, correo_electronico, usuario, hashedPassword]
    );
};

export const validarUsuario = async (usuario, password) => {
    const user = await db.oneOrNone(
        "SELECT * FROM usuario WHERE usuario = $1", 
        [usuario]
    );
    
    if (!user) {
        throw new Error("Usuario no encontrado");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error("Contraseña incorrecta");
    }

    return user;
};

export const obtenerUsuarios = async () => {
    return await db.any("SELECT id, nombre_completo, correo_electronico, usuario FROM Usuario");
};



