import express from "express";
import router from "./routes/index.js";


const app = express();

const PORT = process.env.port || 4000;

app.listen(PORT, () => console.log("Escuchando en el puerto " + PORT));

app.set("view engine", "pug");

app.use(express.static("public"));

app.use("/icons", express.static("node_modules/bootstrap-icons/font"));

app.use("/estilo", express.static("public"))

app.use((req, res, next) => {
    res.locals.identificado = false;
    res.locals.nombre = "Shared Control";
    res.locals.year = new Date().getFullYear();
    next();
})

app.use(express.urlencoded({ extended: true }));

app.use("/", router);