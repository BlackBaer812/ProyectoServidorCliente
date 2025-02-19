/* Aqui hay que importar los modelos que vayamos a usar */
import db from "../config/db.js"

const paginaInicio = async (req, res) => {
    req.session;

    let identificado = false;

    req.session==undefined?identificado=false:identificado=true

    res.render("indice", {
        titulo: "Inicio",
        identificado
    });
}

const paginaRegistro = async (req,res) =>{
    
    res.render("registro", {
        titulo: "titulo",
        identificado: false
    });
}

const registro = async (req,res)=>{
    console.log(req.body)

    res.render("indice",{
        titulo:"Inicio",
        identificado: false
    })
}

export{
    paginaInicio,
    paginaRegistro,
    registro
}