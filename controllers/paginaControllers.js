/* Aqui hay que importar los modelos que vayamos a usar */

const paginaInicio = async (req, res) => {
    req.session;

    let identificado = false;

    req.session==undefined?identificado=false:identificado=true

    res.render("indice", {
        titulo: "Inicio",
        identificado
    });
}

export{
    paginaInicio
}