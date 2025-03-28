import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { agregarUsuario, validarUsuario } from '../DataBase/model/usuarioDAO.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("port", 8000);


app.use(express.json());

//Configuración para que tome los archivos de css y js desde la raiz del proyecto
app.use(express.static(__dirname + "/../"));

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
        const user = await validarUsuario(usuario, password);
        
        res.status(200).json({ 
            success: true,
            message: "Inicio de sesión exitoso",
            user
        });
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: error.message
        });
    }
});



app.listen(app.get("port"), () => {
    console.log("Servidor corriendo en puerto", app.get("port"));
});