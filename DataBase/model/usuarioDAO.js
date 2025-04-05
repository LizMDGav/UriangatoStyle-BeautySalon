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
        //throw new Error("Usuario no encontrado");
        return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error("Contraseña incorrecta");
    }

    return user;
};

export const validarAdministrador = async (usuario, password) => {
    const admin = await db.oneOrNone("SELECT * FROM administradores WHERE usuario = $1", [usuario]);

    if (!admin) {
        return null;
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
        throw new Error("Contraseña incorrecta (admin)");
    }

    return admin;
};

export const obtenerUsuarios = async () => {
    return await db.any("SELECT id, nombre_completo, correo_electronico, usuario FROM Usuario");
};

// Obtener perfil del usuario
export const obtenerPerfilUsuario = async (usuario) => {
    const userData = await db.oneOrNone(
        `SELECT nombre_completo, telefono, correo_electronico, usuario 
         FROM usuario 
         WHERE usuario = $1`,
        [usuario]
    );

    return userData;
};

// Actualizar perfil del usuario
export const actualizarPerfilUsuario = async ({ usuario, nombreCompleto, telefono, correo_electronico, password_actual, nueva_password }) => {
    const user = await db.oneOrNone("SELECT * FROM usuario WHERE usuario = $1", [usuario]);

    if (!user) throw new Error("Usuario no encontrado");

    if (nueva_password) {
        const match = await bcrypt.compare(password_actual, user.password);
        if (!match) throw new Error("Contraseña actual incorrecta");

        const hashedPassword = await bcrypt.hash(nueva_password, 10);

        await db.none(`
            UPDATE usuario 
            SET nombre_completo = $1, telefono = $2, correo_electronico = $3, password = $4 
            WHERE usuario = $5
        `, [nombreCompleto, telefono, correo_electronico, hashedPassword, usuario]);

    } else {
        await db.none(`
            UPDATE usuario 
            SET nombre_completo = $1, telefono = $2, correo_electronico = $3 
            WHERE usuario = $4
        `, [nombreCompleto, telefono, correo_electronico, usuario]);
    }

    return true;
};



// Obtener perfil del admin
export const obtenerPerfilAdmin = async (usuario) => {
    return await db.oneOrNone(
        `SELECT nombre_completo, telefono, correo_electronico, usuario 
         FROM administradores 
         WHERE usuario = $1`,
        [usuario]
    );
};

// Actualizar perfil del admin
export const actualizarPerfilAdmin = async ({ usuario, nombreCompleto, telefono, correo_electronico, password_actual, nueva_password }) => {
    const admin = await db.oneOrNone("SELECT * FROM administradores WHERE usuario = $1", [usuario]);
    if (!admin) throw new Error("Administrador no encontrado");

    if (nueva_password) {
        const match = await bcrypt.compare(password_actual, admin.password);
        if (!match) throw new Error("Contraseña actual incorrecta");

        const hashedPassword = await bcrypt.hash(nueva_password, 10);

        await db.none(`
            UPDATE administradores 
            SET nombre_completo = $1, telefono = $2, correo_electronico = $3, password = $4 
            WHERE usuario = $5
        `, [nombreCompleto, telefono, correo_electronico, hashedPassword, usuario]);
    } else {
        await db.none(`
            UPDATE administradores 
            SET nombre_completo = $1, telefono = $2, correo_electronico = $3 
            WHERE usuario = $4
        `, [nombreCompleto, telefono, correo_electronico, usuario]);
    }

    return true;
};
