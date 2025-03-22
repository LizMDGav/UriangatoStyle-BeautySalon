const db = require("db");

const obtenerUsuarios = async () => {
    return await db.any("SELECT id, nombre_completo, correo_electronico, usuario FROM Usuario");
};

const agregarUsuario = async (nombre, correo, usuario, password) => {
    return await db.one(
        "INSERT INTO Usuario (nombre_completo, correo_electronico, usuario, contraseña) VALUES ($1, $2, $3, $4) RETURNING id, nombre_completo, correo_electronico",
        [nombre, correo, usuario, password]
    );
};

module.exports = { obtenerUsuarios, agregarUsuario };
