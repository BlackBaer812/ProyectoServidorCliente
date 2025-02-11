const paginaInicio = async (req, res) => {
    res.render("index", {
        title: "Inicio"
    });
}