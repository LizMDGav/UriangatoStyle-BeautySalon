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
import {
    obtenerServicios, agregarServicio, actualizarServicio, eliminarServicio,
    serviciosCabello, serviciosEyelashes, serviciosMaqPein, promociones, obtenerServiciosPopulares
} from '../DataBase/model/serviciosDAO.js'
import { obtenerTodasLasCitas } from '../DataBase/model/citaDAO.js';
import { crearBlog, obtenerBlogs, obtenerBlogPorId, obtenerSeccionesBlog, eliminarBlog, actualizarSeccionesBlog, actualizarBlog } from '../DataBase/model/blogsDAO.js';

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
app.get("/Crear_blog", (req, res) => res.sendFile(path.join(__dirname, "../creador_blogs.html")));
app.get("/Ver_blog", (req, res) => res.sendFile(path.join(__dirname, "../blog_detalles.html")));

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


import { obtenerHorasOcupadas } from '../DataBase/model/citaDAO.js';
app.get("/api/citas/ocupadas", async (req, res) => {
    const fecha = req.query.fecha;
    if (!fecha) return res.status(400).json({ success: false, message: "Fecha requerida" });

    try {
        const horas = await obtenerHorasOcupadas({ fecha });
        res.json({ success: true, horas });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});


import { actualizarStatusCita } from '../DataBase/model/citaDAO.js';
app.put('/api/citas/:id', async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    try {
        await actualizarStatusCita(id, status);
        res.json({ success: true });
    } catch (err) {
        console.error("Error al actualizar estado de cita:", err);
        res.status(500).json({ success: false });
    }
});




import cron from "node-cron";
import { actualizarCitasVencidas } from '../DataBase/model/citaDAO.js';

cron.schedule('0 * * * *', async () => {
    try {
        const ahora = new Date();
        await actualizarCitasVencidas(ahora);
        console.log("Citas vencidas actualizadas");
    } catch (err) {
        console.error("Error actualizando citas vencidas:", err);
    }
});


/////////////////////////////////////BLOGS//////////////////////////////////////////
// Ruta absoluta para guardar imágenes
const IMAGES_DIR = path.join(__dirname, '../public/blogs');

// Asegurarse de que el directorio existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Configuración de multer para guardar imágenes
const almacenamiento = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, IMAGES_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'blog-' + uniqueSuffix + ext);
    }
});

const subir = multer({
    storage: almacenamiento,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limitar a 5MB
    fileFilter: function (req, file, cb) {
        // Aceptar solo imágenes
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            return cb(new Error('Solo se permiten archivos de imagen!'), false);
        }
        cb(null, true);
    }
});

// Añade esta función justo después de la configuración de Multer (después de la línea 25)
// Función para eliminar archivos subidos
function eliminarArchivosSubidos(files) {
    if (!files || !Array.isArray(files)) {
        return;
    }

    files.forEach((file) => {
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                console.log(`Archivo eliminado: ${file.path}`);
            }
        } catch (error) {
            console.error(`Error al eliminar archivo ${file.path}:`, error);
        }
    });
}



// Añade estas rutas después de tus rutas existentes

// Ruta para la página de creación de blogs (solo para administradores)
app.get("/crear-blog", (req, res) => {
    const session = req.cookies.user_session;
    if (!session) return res.redirect("/Login");

    try {
        const { tipo } = JSON.parse(session);
        if (tipo !== "admin") return res.redirect("/");

        res.sendFile(path.join(__dirname, "../creador_blogs.html"));
    } catch (error) {
        res.redirect("/Login");
    }
});




// API para crear un nuevo blog
app.post("/api/blogs", subir.any(), async (req, res) => {
    console.log("=== NUEVA SOLICITUD DE CREACIÓN DE BLOG ===");
    console.log("Headers:", req.headers);
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Campos del formulario:", Object.keys(req.body));

    if (req.files && req.files.length > 0) {
        console.log("Archivos recibidos:", req.files.map(f => ({
            fieldname: f.fieldname,
            originalname: f.originalname,
            size: f.size
        })));
    } else {
        console.log("No se recibieron archivos");
    }


    const session = req.cookies.user_session;
    if (!session) {
        // Si no hay sesión, eliminar los archivos que se hayan subido
        eliminarArchivosSubidos(req.files);
        return res.status(401).json({ success: false, message: "No autorizado" });
    }

    try {
        const { usuario, tipo } = JSON.parse(session);
        if (tipo !== "admin") {
            // Si no es admin, eliminar los archivos que se hayan subido
            eliminarArchivosSubidos(req.files);
            return res.status(403).json({ success: false, message: "Acceso denegado" });
        }

        console.log("Archivos recibidos:", req.files);
        console.log("Datos del formulario:", req.body);

        // Obtener el ID del administrador
        const adminData = await obtenerPerfilAdmin(usuario);
        if (!adminData) return res.status(404).json({ success: false, message: "Administrador no encontrado" });

        // Verificar que los campos requeridos existan
        if (!req.body.title || !req.body.description) {
            return res.status(400).json({
                success: false,
                message: "Faltan campos requeridos (título o descripción)"
            });
        }

        // Verificar que sections sea un JSON válido
        let parsedSections;
        try {
            parsedSections = JSON.parse(req.body.sections || '[]');
        } catch (e) {
            console.error("Error al parsear sections:", e);
            return res.status(400).json({
                success: false,
                message: "El formato de las secciones es inválido"
            });
        }

        // Procesar imagen principal
        let mainImagePath = null;
        const mainImageFile = req.files.find(file => file.fieldname === 'mainImage');
        if (mainImageFile) {
            mainImagePath = '/public/blogs/' + mainImageFile.filename;
        }

        // Crear el blog
        const blogId = await crearBlog({
            title: req.body.title,
            description: req.body.description,
            image_path: mainImagePath,
            admin_id: adminData.id,
            sections: parsedSections.map((section, index) => {
                // Buscar imagen de sección
                let sectionImagePath = null;
                const sectionImageFile = req.files.find(file => file.fieldname === `sectionImage_${index}`);

                if (sectionImageFile) {
                    sectionImagePath = '/public/blogs/' + sectionImageFile.filename;
                }

                return {
                    subtitle: section.subtitle || null,
                    content: section.content,
                    image_path: sectionImagePath,
                    section_order: section.section_order
                };
            })
        });

        res.status(201).json({
            success: true,
            message: 'Blog creado exitosamente',
            blogId
        });

    } catch (error) {
        console.error('Error al crear blog:', error);

        // Eliminar archivos subidos en caso de error
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error al eliminar archivo:', err);
                });
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear el blog: ' + error.message
        });
    }
});

// API para obtener todos los blogs
app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await obtenerBlogs();
        res.json({ success: true, blogs: blogs || [] });
    } catch (error) {
        console.error("Error al obtener blogs:", error);
        res.status(500).json({ success: false, message: "Error al cargar blogs." });
    }
});

// API para obtener un blog específico con sus secciones
app.get("/api/blogs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await obtenerBlogPorId(id);

        if (!blog) {
            return res.status(404).json({ success: false, message: "Blog no encontrado" });
        }

        const secciones = await obtenerSeccionesBlog(id);

        res.json({
            success: true,
            blog: {
                ...blog,
                sections: secciones
            }
        });
    } catch (error) {
        console.error("Error al obtener blog:", error);
        res.status(500).json({ success: false, message: "Error al cargar el blog." });
    }
});

// API para eliminar un blog
app.delete("/api/blogs/:id", async (req, res) => {
    console.log(`Solicitud para eliminar blog ID: ${req.params.id}`)

    const session = req.cookies.user_session
    if (!session) {
        return res.status(401).json({ success: false, message: "No autorizado" })
    }

    try {
        const { tipo } = JSON.parse(session)
        if (tipo !== "admin") {
            return res.status(403).json({ success: false, message: "Acceso denegado" })
        }

        const blogId = Number.parseInt(req.params.id)
        if (isNaN(blogId)) {
            return res.status(400).json({ success: false, message: "ID de blog inválido" })
        }

        // Eliminar el blog y sus imágenes asociadas
        const eliminado = await eliminarBlog(blogId)

        if (eliminado) {
            return res.json({
                success: true,
                message: "Blog eliminado correctamente",
            })
        } else {
            return res.status(404).json({
                success: false,
                message: "Blog no encontrado",
            })
        }
    } catch (error) {
        console.error("Error al eliminar blog:", error)
        return res.status(500).json({
            success: false,
            message: "Error al eliminar el blog",
            error: error.message,
        })
    }
});


// Añadir esta ruta para la página de edición de blogs (solo para administradores)
app.get("/editar-blog", (req, res) => {
    const session = req.cookies.user_session
    if (!session) return res.redirect("/Login")

    try {
        const { tipo } = JSON.parse(session)
        if (tipo !== "admin") return res.redirect("/")

        // Usar la misma página de creación, el JavaScript detectará si es edición
        res.sendFile(path.join(__dirname, "../creador_blogs.html"))
    } catch (error) {
        res.redirect("/Login")
    }
})

// Añadir esta API para actualizar un blog existente
app.put("/api/blogs/:id", subir.any(), async (req, res) => {
    console.log("=== SOLICITUD DE ACTUALIZACIÓN DE BLOG ===")
    console.log("Headers:", req.headers)
    console.log("Content-Type:", req.headers["content-type"])
    console.log("Campos del formulario:", Object.keys(req.body))

    if (req.files && req.files.length > 0) {
        console.log(
            "Archivos recibidos:",
            req.files.map((f) => ({
                fieldname: f.fieldname,
                originalname: f.originalname,
                size: f.size,
            })),
        )
    } else {
        console.log("No se recibieron archivos")
    }

    const session = req.cookies.user_session
    if (!session) {
        // Si no hay sesión, eliminar los archivos que se hayan subido
        eliminarArchivosSubidos(req.files);
        return res.status(401).json({ success: false, message: "No autorizado" });
    }

    try {
        const { usuario, tipo } = JSON.parse(session)
        if (tipo !== "admin") {
            // Si no es admin, eliminar los archivos que se hayan subido
            eliminarArchivosSubidos(req.files);
            return res.status(403).json({ success: false, message: "Acceso denegado" });
        }

        const blogId = Number.parseInt(req.params.id)
        if (isNaN(blogId)) {
            return res.status(400).json({ success: false, message: "ID de blog inválido" })
        }

        // Verificar que el blog existe
        const blogExistente = await obtenerBlogPorId(blogId)
        if (!blogExistente) {
            return res.status(404).json({ success: false, message: "Blog no encontrado" })
        }

        // Verificar que los campos requeridos existan
        if (!req.body.title || !req.body.description) {
            return res.status(400).json({
                success: false,
                message: "Faltan campos requeridos (título o descripción)",
            })
        }

        // Verificar que sections sea un JSON válido
        let parsedSections
        try {
            parsedSections = JSON.parse(req.body.sections || "[]")
        } catch (e) {
            console.error("Error al parsear sections:", e)
            return res.status(400).json({
                success: false,
                message: "El formato de las secciones es inválido",
            })
        }

        // Procesar imagen principal
        let mainImagePath = blogExistente.image_path // Mantener la imagen existente por defecto
        const mainImageFile = req.files.find((file) => file.fieldname === "mainImage")
        if (mainImageFile) {
            // Si se sube una nueva imagen, actualizar la ruta
            mainImagePath = "/public/blogs/" + mainImageFile.filename

            // Eliminar la imagen anterior si existe
            if (blogExistente.image_path) {
                // Obtener la ruta absoluta del archivo
                const rutaAbsoluta = path.join(__dirname, "..", blogExistente.image_path)
                // Verificar si el archivo existe antes de intentar eliminarlo
                if (fs.existsSync(rutaAbsoluta)) {
                    fs.unlinkSync(rutaAbsoluta)
                    console.log(`Imagen principal anterior eliminada: ${rutaAbsoluta}`)
                }
            }
        }

        // Procesar las imágenes de las secciones
        for (let i = 0; i < parsedSections.length; i++) {
            const section = parsedSections[i]
            const sectionImageFile = req.files.find((file) => file.fieldname === `sectionImage_${i}`)

            if (sectionImageFile) {
                // Si se sube una nueva imagen, actualizar la ruta
                section.image_path = "/public/blogs/" + sectionImageFile.filename
            }
            // Si no hay nueva imagen y no hay image_path, asegurarse de que sea null
            if (!section.image_path) {
                section.image_path = null
            }
        }

        // Actualizar el blog principal
        await actualizarBlog({
            id: blogId,
            title: req.body.title,
            description: req.body.description,
            image_path: mainImagePath,
        })

        // Actualizar las secciones del blog
        await actualizarSeccionesBlog(blogId, parsedSections)

        res.json({
            success: true,
            message: "Blog actualizado exitosamente",
            blogId,
        })
    } catch (error) {
        console.error("Error al actualizar blog:", error)

        // Eliminar archivos subidos en caso de error
        if (req.files) {
            req.files.forEach((file) => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error("Error al eliminar archivo:", err)
                })
            })
        }

        res.status(500).json({
            success: false,
            message: "Error al actualizar el blog: " + error.message,
        })
    }
})


// Ruta para ver un blog específico
app.get("/:id", (req, res) => res.sendFile(path.join(__dirname, "../blog_detalles.html")));
