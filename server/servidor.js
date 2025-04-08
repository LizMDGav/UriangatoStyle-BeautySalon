import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { agregarUsuario, validarUsuario, validarAdministrador } from '../DataBase/model/usuarioDAO.js';
import { obtenerPerfilUsuario, actualizarPerfilUsuario } from '../DataBase/model/usuarioDAO.js';
import { obtenerPerfilAdmin, actualizarPerfilAdmin } from '../DataBase/model/usuarioDAO.js';
import { agregarCita, obtenerCitasId } from '../DataBase/model/citaDAO.js';
import { obtenerServicios, agregarServicio, actualizarServicio, eliminarServicio,
    serviciosCabello, serviciosEyelashes, serviciosMaqPein, promociones, obtenerServiciosPopulares} from '../DataBase/model/serviciosDAO.js'
import { obtenerTodasLasCitas } from '../DataBase/model/citaDAO.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta para guardar imágenes
const imgPath = path.join('public', 'img_servicios');
fs.mkdirSync(imgPath, { recursive: true });

const app = express();
app.set("port", 8000);

app.use(express.json());
app.use(cookieParser());

//Configuración para que tome los archivos de css y js desde la raiz del proyecto
app.use(express.static(__dirname + "/../"));
app.use(express.static('public'));

// Rutas
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../index.html")));
app.get("/Servicios", (req, res) => res.sendFile(path.join(__dirname, "../servicios.html")));
app.get("/Sucursales", (req, res) => res.sendFile(path.join(__dirname, "../sucursales.html")));
app.get("/Nosotros", (req, res) => res.sendFile(path.join(__dirname, "../nosotros.html")));
app.get("/Login", (req, res) => res.sendFile(path.join(__dirname, "../login.html")));
app.get("/Registro", (req, res) => res.sendFile(path.join(__dirname, "../registro.html")));
app.get("/Galeria", (req, res) => res.sendFile(path.join(__dirname, "../galeria_trabajos.html")));
app.get("/Blog", (req, res) => res.sendFile(path.join(__dirname, "../blog.html")));
app.get("/AgendarCita", (req, res) => res.sendFile(path.join(__dirname, "../agendar_cita.html")));
app.get("/AdministrarServicios", (req, res) => res.sendFile(path.join(__dirname, "../crud_servicios.html")));
app.get("/Perfil", (req, res) => res.sendFile(path.join(__dirname, "../perfil.html")));
app.get("/CitasProgramadas", (req, res) => res.sendFile(path.join(__dirname, "../citas_programadas.html")));

// Rutas para el envio de datos a la bd
app.post("/api/usuarios/registro", async (req, res) => {
    try {
        const newUser = await agregarUsuario(req.body);
        //res.status(201).json(newUser);
        res.status(200).json({
            success: true,
            message: "Registro exitoso",
            newUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/usuarios/login", async (req, res) => {
    try {
        const { usuario, password } = req.body;

        let tipoUsuario = "usuario";
        let user = await validarUsuario(usuario, password);

        // Si no existe en la tabla de usuarios, revisar como admin
        if (!user) {
            const admin = await validarAdministrador(usuario, password);
            if (admin) {
                tipoUsuario = "admin";
                user = admin;
            } else {
                throw new Error("Usuario no encontrado");
            }
        }

        // Crear cookie con mas informacion
        res.cookie('user_session', JSON.stringify({
            usuario: user.usuario,
            tipo: tipoUsuario
        }), {
            httpOnly: true,
            maxAge: 30 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso",
            tipo: tipoUsuario
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
});



// Ruta para verificar sesion
app.get("/api/usuarios/sesion", async (req, res) => {
    const session = req.cookies.user_session;

    if (!session) {
        return res.status(401).json({ loggedIn: false });
    }

    try {
        const { usuario, tipo } = JSON.parse(session);

        res.json({ loggedIn: true, usuario, tipo });

    } catch (error) {
        console.error("Error al obtener sesión:", error);
        res.status(500).json({ loggedIn: false, error: error.message });
    }
});


// Ruta para cerrar sesion
app.post("/api/usuarios/logout", (req, res) => {
    res.clearCookie("user_session");
    res.json({ success: true, message: "Sesión cerrada" });
});


app.listen(app.get("port"), () => {
    console.log("Servidor corriendo en puerto", app.get("port"));
});


// Obtener el perfil tanto de usuarios como de administradores
app.get("/api/usuarios/perfil", async (req, res) => {
    const session = req.cookies.user_session;

    if (!session) return res.status(401).json({ success: false, message: "No autorizado" });

    try {
        const { usuario, tipo } = JSON.parse(session);
        const data = tipo === "admin"
            ? await obtenerPerfilAdmin(usuario)
            : await obtenerPerfilUsuario(usuario);

        if (!data) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        const [nombre = "", apellido = ""] = data.nombre_completo.split(" ", 2);

        res.json({
            success: true,
            data: {
                nombre,
                apellido,
                telefono: data.telefono || "",
                correo_electronico: data.correo_electronico,
                usuario: data.usuario
            }
        });

    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});


// Actualizar los datos del perfil del usario como del administrador
app.put("/api/usuarios/perfil", async (req, res) => {
    const session = req.cookies.user_session;
    if (!session) return res.status(401).json({ success: false, message: "No autorizado" });

    try {
        const { usuario, tipo } = JSON.parse(session);
        const {
            nombre,
            apellidos,
            telefono,
            correo_electronico,
            password_actual,
            nueva_password
        } = req.body;

        const nombreCompleto = `${nombre} ${apellidos}`;

        if (tipo === "admin") {
            await actualizarPerfilAdmin({
                usuario,
                nombreCompleto,
                telefono,
                correo_electronico,
                password_actual,
                nueva_password
            });
        } else {
            await actualizarPerfilUsuario({
                usuario,
                nombreCompleto,
                telefono,
                correo_electronico,
                password_actual,
                nueva_password
            });
        }

        res.json({ success: true, message: "Perfil actualizado correctamente" });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ruta para mandar los datos de una nueva cita
app.post("/api/citas/agendar", async (req, res) => {
    const session = req.cookies.user_session;
    if (!session) return res.status(401).json({ success: false, message: "No autorizado" });

    try {
        const { usuario } = JSON.parse(session);
        const {
            servicio,
            telefono,
            correo,
            fecha,
            hora,
            costo,
            domicilio
        } = req.body;

        // Validación de que no esten vacios los datos
        if (!servicio || !telefono || !correo || !fecha || !hora || !costo) {
            return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
        }

        const usuarioDatos = await obtenerPerfilUsuario(usuario);
        if (!usuarioDatos) return res.status(404).json({ success: false, message: "Usuario no encontrado." });

        const idUsuario = usuarioDatos.id;

        const nuevaCita = await agregarCita({
            idUsuario,
            servicio,
            idSede: 1,
            telefono,
            correo,
            fecha,
            hora,
            costo,
            estatus: "Activa", // Activa, Cancelada, Terminada
            domicilio
        });

        res.json({ success: true, message: "Cita registrada correctamente.", id: nuevaCita.id });

    } catch (error) {
        console.error("Error al agendar cita:", error);
        res.status(500).json({ success: false, message: "Error al registrar la cita." });
    }
});

// Obtener los servicios
app.get("/api/servicios", async (req, res) => {
    try {
        const servicios = await obtenerServicios();
        res.json({ success: true, servicios });
    } catch (error) {
        console.error("Error al obtener servicios:", error);
        res.status(500).json({ success: false, message: "Error al cargar servicios." });
    }
});

// Obtener las citas de X usuario
app.get("/api/citas", async (req, res) => {
    const session = req.cookies.user_session;
    if (!session) return res.status(401).json({ success: false, message: "No autorizado" });

    try {
        const { usuario, tipo } = JSON.parse(session);

        if (tipo === "admin") {
            const citas = await obtenerTodasLasCitas();
            return res.json({ success: true, citas });
        }

        const perfil = await obtenerPerfilUsuario(usuario);
        if (!perfil) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        const citas = await obtenerCitasId({ id: perfil.id });

        res.json({ success: true, citas });

    } catch (error) {
        console.error("Error al obtener citas:", error);
        res.status(500).json({ success: false, message: "Error del servidor" });
    }
});

// Obtener los servicios
app.get("/api/servicios", async (req, res) => {
    try {
        const servicios = await obtenerServicios();
        res.json({ success: true, servicios });
    } catch (error) {
        console.error("Error al obtener servicios:", error);
        res.status(500).json({ success: false, message: "Error al cargar servicios." });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imgPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });


app.post('/api/servicios/agregar', upload.single('imagen'), async (req, res) => {
    try {
        const { nombre, descripcion, costo, descuento, categoria } = req.body;
        const imagen = req.file ? `/img_servicios/${req.file.filename}` : null;

        const nuevoServicio = await agregarServicio({
            nombre, descripcion, costo, descuento, imagen, categoria
        });

        res.json({ success: true, servicio: nuevoServicio });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al agregar servicio' });
    }
});



// Ruta PUT actualizada
app.put("/api/servicios/editar/:id", upload.single('imagen'), async (req, res) => {
    const session = req.cookies.user_session;
    if (!session) return res.status(401).json({ success: false, message: "No autorizado" });

    try {
        const { tipo } = JSON.parse(session);
        if (tipo !== "admin") return res.status(403).json({ success: false, message: "No tienes permisos" });

        const { nombre, descripcion, costo, descuento, categoria } = req.body;
        if (!nombre) {
            return res.status(400).json({ 
                success: false, 
                message: "El nombre del servicio es requerido" 
            });
        }

        // Obtener ruta de la nueva imagen si se cargó
        const nuevaRutaImagen = req.file ? `/img_servicios/${req.file.filename}` : undefined;

        const datosActualizacion = {
            id: req.params.id,
            nombre,
            descripcion,
            costo: parseFloat(costo),
            descuento: descuento ? parseFloat(descuento) : 0,
            categoria,
            imagen: nuevaRutaImagen // puede ser undefined, y se manejará desde el DAO
        };

        const servicioActualizado = await actualizarServicio(datosActualizacion);
        res.json({ success: true, servicio: servicioActualizado });
    } catch (error) {
        console.error("Error completo en la actualización:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al actualizar servicio",
            error: error.message,
            stack: error.stack 
        });
    }
});

app.delete("/api/servicios/eliminar/:id", async (req, res) => {
    const session = req.cookies.user_session;
    if (!session) return res.status(401).json({ success: false, message: "No autorizado" });
    
    try {
        const { tipo } = JSON.parse(session);
        if (tipo !== "admin") return res.status(403).json({ success: false, message: "No tienes permisos" });

        await eliminarServicio(req.params.id);
        res.json({ success: true, message: "Servicio eliminado" });
    } catch (error) {
        console.error("Error al eliminar servicio:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/servicios/cabello', async (req, res) => {
    try {
        const servicios = await serviciosCabello();
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener servicios de cabello' });
    }
});

app.get('/api/servicios/eyelashes', async (req, res) => {
    try {
        const servicios = await serviciosEyelashes();
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener servicios de pestañas' });
    }
});

app.get('/api/servicios/maquillaje_peinado', async (req, res) => {
    try {
        const servicios = await serviciosMaqPein();
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener servicios de maquillaje y peinado' });
    }
});

app.get('/api/servicios/promociones', async (req, res) => {
    try {
        const servicios = await promociones();
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener promociones' });
    }
});

app.get('/api/servicios/serviciospopulares', async (req, res) => {
    try {
        const servicios = await obtenerServiciosPopulares();
        if (servicios.length === 0) {
            res.status(404).json({ error: 'No se encontraron servicios populares.' });
        } else {
            res.json(servicios); // Si todo va bien, devolver los servicios
        }
    } catch (error) {
        console.error(error); // Esto es importante para ver el error en la consola del servidor
        res.status(500).json({ error: `Error al obtener servicios populares: ${error.message}` });
    }
});
