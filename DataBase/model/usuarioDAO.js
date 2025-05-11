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
        `SELECT id, nombre_completo, telefono, correo_electronico, usuario 
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


/**
 * Obtiene los datos de ventas para un reporte según el tipo y parámetros
 * @param {Object} params - Parámetros para el reporte
 * @param {string} params.tipo - Tipo de reporte: 'dia', 'mes', 'anio'
 * @param {string} [params.fecha] - Fecha para reporte diario (YYYY-MM-DD)
 * @param {number} [params.mes] - Mes para reporte mensual (1-12)
 * @param {number} [params.anio] - Año para reporte mensual o anual
 * @returns {Promise<Object>} - Datos del reporte con etiquetas y valores
 */
export const obtenerReporteVentas = async (params) => {
    const { tipo, fecha, mes, anio } = params;
    let query = '';
    let queryParams = [];

    console.log('Parámetros recibidos:', params);

    // Construir la consulta SQL según el tipo de reporte
    switch (tipo) {
        case 'dia':
            // Reporte por día (agrupado por hora)
            query = `
                SELECT 
                    EXTRACT(HOUR FROM hora) as hora_del_dia,
                    SUM(costo) as total_ventas
                FROM citasprogramadas
                WHERE fecha = $1 AND estatus = 'Terminada'
                GROUP BY hora_del_dia
                ORDER BY hora_del_dia
            `;
            queryParams = [fecha];
            break;

        case 'mes':
            // Reporte por mes (agrupado por día)
            query = `
                SELECT 
                    EXTRACT(DAY FROM fecha) as dia_del_mes,
                    SUM(costo) as total_ventas
                FROM citasprogramadas
                WHERE EXTRACT(MONTH FROM fecha) = $1 
                AND EXTRACT(YEAR FROM fecha) = $2
                AND estatus = 'Terminada'
                GROUP BY dia_del_mes
                ORDER BY dia_del_mes
            `;
            queryParams = [parseInt(mes), parseInt(anio)];
            break;

        case 'anio':
            // Reporte por anio (agrupado por mes)
            query = `
                SELECT 
                    EXTRACT(MONTH FROM fecha) as mes_del_anio,
                    SUM(costo) as total_ventas
                FROM citasprogramadas
                WHERE EXTRACT(YEAR FROM fecha) = $1
                AND estatus = 'Terminada'
                GROUP BY mes_del_anio
                ORDER BY mes_del_anio
            `;
            queryParams = [parseInt(anio)];
            break;

        default:
            throw new Error("Tipo de reporte no válido");
    }

    console.log('Consulta SQL:', query);
    console.log('Parámetros de consulta:', queryParams);

    try {
        // Ejecutar la consulta
        const result = await db.query(query, queryParams);

        console.log('Resultado de la consulta:', result);

        // Determinar la estructura correcta del resultado
        const rows = Array.isArray(result) ? result : (result.rows || []);

        // Verificar si hay resultados
        if (!rows || rows.length === 0) {
            console.log('No se encontraron resultados');
            return {
                etiquetas: [],
                valores: []
            };
        }

        // Procesar los resultados para el formato esperado por el gráfico
        let etiquetas = [];
        let valores = [];

        if (tipo === 'dia') {
            // Formatear horas (8:00, 9:00, etc.)
            rows.forEach(row => {
                etiquetas.push(`${row.hora_del_dia}:00`);
                valores.push(parseFloat(row.total_ventas));
            });
        } else if (tipo === 'mes') {
            // Formatear días (1, 2, 3, etc.)
            rows.forEach(row => {
                etiquetas.push(row.dia_del_mes.toString());
                valores.push(parseFloat(row.total_ventas));
            });
        } else if (tipo === 'anio') {
            // Formatear meses (Enero, Febrero, etc.)
            const nombresMeses = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];

            rows.forEach(row => {
                const indice = parseInt(row.mes_del_anio) - 1;
                etiquetas.push(nombresMeses[indice]);
                valores.push(parseFloat(row.total_ventas));
            });
        }

        console.log('Datos procesados:', { etiquetas, valores });

        return {
            etiquetas,
            valores
        };
    } catch (error) {
        console.error('Error en la consulta SQL:', error);
        throw error;
    }
};