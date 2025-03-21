import express from "express";
import router from "./routes/index.js";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config()

const app = express();

const PORT = process.env.port || 4000;

app.listen(PORT, () => console.log("Escuchando en el puerto " + PORT));

app.set("view engine", "pug");

app.use(express.static("public"));

app.use("/icons", express.static("node_modules/bootstrap-icons/font"));

app.use("/popover", express.static("node_modules/bootstrap/js/dist"));

app.use("/estilo", express.static("public"))

app.use(session({
    secret: process.env.SESSION_SECRET, // Clave secreta para firmar la sesión
    resave: false,              // No guardar la sesión si no se ha modificado
    saveUninitialized: true,    // Guardar la sesión si no ha sido modificada
    cookie: { 
        secure: false, 
        maxAge: 3600000
    }   // 'secure' debería ser 'true' si usas HTTPS
}));

app.use((req, res, next) => {
    res.locals.nombre = "Shared Control";
    res.locals.year = new Date().getFullYear();
    res.locals.alerta = req.session.alerta || "black";
    next();
})

app.use(express.urlencoded({ extended: true }));

app.use("/", router);