/* Aqui hay que importar los modelos que vayamos a usar */

const paginaInicio = async (req, res) => {
    res.render("indice", {
        titulo: "Inicio"
    });
}

export{
    paginaInicio
}