/* Aqui hay que importar los modelos que vayamos a usar */

import db from "../config/db.js"
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config()

const paginaInicio = async (req, res) => {
    

    res.render("indice", {
        titulo: "Inicio",
        identificado: identificacion(req)
    });
}

const paginaRegistro = async (req,res) =>{
    
    res.render("registro", {
        titulo: "titulo",
        identificado: identificacion(req)
    });
}

const paginaISesion = async(req,res)=>{
    res.render("iSesion",{
        titulo: "Inicio de sesión",
        identificado: identificacion(req),
    })
}

const iSesion = async(req,res)=>{

    if(req.session.usuario != undefined){
        const envio = await grupos(req.session.usuario);
        
        res.render("principal", {
            titulo: "Pagina de usuario",
            identificado: identificacion(req),
            grupos: envio
        })
    }
    else {
        try {
            await db.execute("CALL iSesion(?,?,@salida)", [
                req.body.usuario,
                req.body.password
            ])

            const [rows] = await db.execute("SELECT @salida AS salida");

            const autentificado = rows[0].salida == 1 ? true : false;

            if (autentificado) {
                req.session.usuario = req.body.usuario;

                const envio = await grupos(req.session.usuario);

                res.render("principal", {
                    titulo: "Pagina de usuario",
                    identificado: identificacion(req),
                    grupos: envio
                })
            }
            else {

                res.render("iSesion", {
                    titulo: "Inicio de sesión",
                    identificado: identificacion(req),
                    mensaje: true,
                    usuario: req.body.usuario,
                    password: req.body.password
                })
            }

        }
        catch (err) {
            console.error(err)
        }
    }
    
}

const cerrarSesion = async (req,res) => {
    req.session.destroy(err =>{
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).send("Error al cerrar sesión");
        }
        res.redirect("/");
    })
}

const verifica = async(req,res)=>{
    const {verificacion,usuario} = req.params;

    try{
        await db.execute("CALL verificacion(?, ?)", [
            verificacion,
            usuario
        ]);

        res.render("iSesion",{
            titulo: "Inicio de sesión",
            identificado: identificacion(req),
        })
    }
    catch(err){
        console.error(err)
    }
}

const registro = async (req,res)=>{

    
    let aleatorio = generarAleatorio();

    let entrada = {
        user: req.body.usuario,
        password: req.body.password,
        email: req.body.email,
        nombre: req.body.nombre,
        telefono: req.body.telefono,
    }

    //console.log(entrada)

    try{

        await db.execute("CALL alta_user(?, ?, ?, ?, ?, ?, @salida, @existe)", [
                entrada.user,
                entrada.password,
                entrada.email,
                entrada.nombre,
                entrada.telefono,
                aleatorio
            ]);

        const [rows] = await db.execute("SELECT @salida AS salida, @existe AS existe");

        /*Comprobamos si existe el elemento que introducimos en la base de datos:
            1: el elemento existe -> ponemos falso para ir al if
            2: el elemento no existe -> ponemos true para ir al else
        */
        const existe = rows[0].existe == 1? true:false; 
        
        /*Si existe tenemos que mandar un email al email enviado*/
        if(existe){//Existe
            console.log("Existe, no se crea")
            res.render("registro",{
                titulo:"Registro",
                identificado: identificacion(req),
                mensaje:true,
                usuario: entrada.user,
                email: entrada.email,
                nom: entrada.nombre,
                telf: entrada.telefono
            })
        }else{//No existe
            console.log("No existe, se crea")
            //Enviamos un email con un link para activar la cuenta
            const transporter = nodemailer.createTransport({
                service: 'gmail',  // Usando Gmail como servicio de correo
                auth: {
                    user: 'marcosruizclemente@gmail.com', // Reemplaza con tu correo de Gmail
                    pass:  process.env.CONTRA_EMAIL // Reemplaza con tu contraseña o una contraseña de aplicación
                }
            });

            const mailOptions = {
                from: `marcosruizclemente@gmail.com`,      // Remitente
                to: entrada.email,         // Destinatario
                subject: `Alta en Shared Control ` + entrada.user,  // Asunto
                // text:
                //     'Nombre: ' + entrada.user + '\n' +
                //     'Correo: ' + entrada.email + '\n' +
                //     'Teléfono: ' + entrada.telefono + '\n'
                // ,
                html: `<a href="http://127.0.0.1:4000/verificacion/${rows[0].salida}/${entrada.user}"> Link de activación </a>`
            };

            await transporter.sendMail(mailOptions);

            res.render("indice",{
                titulo:"Inicio",
                identificado: identificacion(req)
            })
        }
    }
    catch(err){
        //Si el error es el 1062 es q hay algo repetido que no se puede repetir (tlf y/o email)
        console.error(err.errno)
        console.error(err)
        if(err.errno == 1062){
            res.render("registro",{
                titulo:"Registro",
                identificado: identificacion(req),
                //El mensaje es true cuando no se ha podido dar de alta
                mensaje: true
            })
        }
    }
}

const pagCrearGrupo = async(req,res) =>{
    if(identificacion(req)){
        res.render("crearGrupo",{
            titulo:"Crear grupo",
            identificado: identificacion(req)
        })
    }
    else{//Si no se esta registrado o con la sesión iniciada, se vuelve a inicio
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }


}

const volverPPrincial = async(req,res) =>{
    if(identificacion(req)){
        
        const envio = await grupos(req.session.usuario);

        res.render("principal",{
            titulo: "Pagina de usuario",
            identificado: identificacion(req),
            grupos: envio
        })
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const crearGrupo = async(req,res) =>{
    if(identificacion(req)){

        let nombreG = req.body.nGrup;
        const user = req.session.usuario;

        try{
            await db.execute("CALL crearGrupo(?,?)",[
                nombreG,
                user
            ])
            
            const envio = await grupos(req.session.usuario);

            res.render("principal",{
                titulo: "Pagina de usuario",
                identificado: identificacion(req),
                grupos: envio
            })
        }
        catch(err){
            console.error(err)
            const envio = await grupos(req.session.usuario);

            res.render("principal",{
                titulo: "Pagina de usuario",
                identificado: identificacion(req),
                grupos: envio
            })
        }
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const accesoGrupo = async(req,res) =>{

    if(identificacion(req)){
        const idG = req.params.idGrup;
        const idP = req.session.usuario;
        
        try{

            const resultado = await datosG(idG,idP);

            req.session.grupo = idG;

            if(resultado[5] != 1){
                res.render("grupoP",{
                    titulo:"Pagina del grupo " + resultado[2],
                    idP,
                    idG,
                    identificado: identificacion(req),
                    sActual: resultado[1],
                    gMedios : resultado[0],
                    datos: resultado[3],
                    datosP: resultado[4],
                })
            }
            else{
                res.render("grupoP",{
                    titulo:"Pagina del grupo " + resultado[2],
                    identificado: identificacion(req),
                    sActual: resultado[1],
                    gMedios : resultado[0],
                    datos: resultado[3],
                    datosP: resultado[4],
                })
            }
        }
        catch(err){
            console.error(err)
            const envio = await grupos(req.session.usuario);

            res.render("principal",{
                titulo: "Pagina de usuario",
                identificado: identificacion(req),
                grupos: envio
            })
        }
        
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const paginaFactura = async(req,res)=>{
    if(identificacion(req)){
        try{
            let resp = await db.query("SELECT * FROM tipo");

            res.render("aFactura",{
                titulo:"Crear factura",
                identificado: identificacion(req),
                tipos: resp[0],
                idG:req.session.grupo
            })
        }
        catch(err){
            console.error(err)
            const envio = await grupos(req.session.usuario);

            res.render("principal",{
                titulo: "Pagina de usuario",
                identificado: identificacion(req),
                grupos: envio
            })
        }
        
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const paginaFacturaParams = async(req,res) => {
    if(identificacion(req)){
        req.session.grupo = req.params.idG;
        try{
            let resp = await db.query("SELECT * FROM tipo");

            res.render("aFactura",{
                titulo:"Crear factura",
                identificado: identificacion(req),
                tipos: resp[0],
                idG:req.session.grupo
            })
        }
        catch(err){
            console.error(err)
            const envio = await grupos(req.session.usuario);

            res.render("principal",{
                titulo: "Pagina de usuario",
                identificado: identificacion(req),
                grupos: envio
            })
        }
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const crearFactura = async(req,res) =>{
    if(identificacion(req)){
        let idU = req.session.usuario;
        let idG = req.session.grupo;

        let datos = req.body;

        let resp = await db.query("SELECT * FROM tipo");

        if(datos.tipo != "" && datos.fecha != "" && datos.valor != "" && datos.nombre != "" && datos.comentario !=""){


            try{
                
                await db.execute("CALL compra (?,?,?,?,?,?,?)",[
                    idU,
                    idG,
                    datos.tipo,
                    datos.fecha,
                    datos.valor,
                    datos.nombre,
                    datos.comentario
                ])

                res.render("aFactura",{
                    titulo:"Crear factura",
                    identificado: identificacion(req),
                    tipos: resp[0],
                    idG
                })
            }
            catch(err){
                console.error(err)

                let texto = "Su factura no se ha podido dar de alta";
    
                res.render("aFactura",{
                    titulo:"Crear factura",
                    identificado: identificacion(req),
                    mensaje: true,
                    texto,
                    tipos: resp[0],
                    tip: datos.tipo,
                    fech: datos.fecha,
                    val: datos.valor,
                    nom: datos.nombre,
                    com: datos.comentario,
                    idG
                })
            }
        }
        else{
            let texto = "No todos los campos están completos";

            res.render("aFactura",{
                titulo:"Crear factura",
                identificado: identificacion(req),
                mensaje: true,
                texto,
                tipos: resp[0],
                tip: datos.tipo,
                fech: datos.fecha,
                val: datos.valor,
                nom: datos.nombre,
                com: datos.comentario,
                idG
            })  
        }
        
        
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const borrar = async (req,res) =>{
    if(identificacion(req)){
        const idG = req.session.grupo;
        const idP = req.session.usuario;

        try{
            const salida = await db.execute("CALL borrado(?)",[
                req.params.idCompra
            ])

            const resultado = await datosG(idG,idP)

            if(resultado[5] != 1){
                res.render("grupoP",{
                    titulo:"Pagina del grupo " + resultado[2],
                    idP,
                    idG,
                    identificado: identificacion(req),
                    sActual: res[1],
                    gMedios : resultado[0],
                    datos: resultado[3],
                    datosP: resultado[4],
                    borrado: salida[0].affectedRows
                })
            }
            else{
                res.render("grupoP",{
                    titulo:"Pagina del grupo " + resultado[2],
                    identificado: identificacion(req),
                    borrado: salida[0].affectedRows
                })
            }
        }
        catch(err){
            console.error(err)

            const resultado = await datosG(idG,idP)

            if(resultado[5] != 1){
                res.render("grupoP",{
                    titulo:"Pagina del grupo " + resultado[2],
                    idP,
                    idG,
                    identificado: identificacion(req),
                    sActual: resultado[1],
                    gMedios : resultado[0],
                    datos: resultado[3],
                    datosP: resultado[4],
                })
            }
            else{
                res.render("grupoP",{
                    titulo:"Pagina del grupo " + resultado[2],
                    identificado: identificacion(req),
                })
            }
        }
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const paginaAnadir = async(req,res) =>{
    if(identificacion(req)){
        try{
            const idG = req.session.grupo;
            const resultado = await db.query("SELECT usuarios.nombre, usuarios.telefono, usuarios.email FROM pertenece inner join usuarios on pertenece.userid = usuario where grupoid = ?",
                idG
            )

            res.render("anadirU",{
                titulo:"Añadir usuario",
                identificado: identificacion(req),
                datos: resultado[0],
                idG
            })
        }
        catch(err){
            console.error(err)

            const envio = await grupos(req.session.usuario);

            res.render("principal",{
                titulo: "Pagina de usuario",
                identificado: identificacion(req),
                grupos: envio
            })
        }

        
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const anadirParticipante = async (req,res) =>{
    if(identificacion(req)){
        let body = req.body
        const idG = req.session.grupo;

        if(body.telefono != "" || body.email != ""){

            const idU = req.body.usuario;
            const tlf = req.body.telefono == 0 ? null: req.body.telefono;
            const email = req.body.email;
            const admin = req.body.admin == "on" ? 1:0;

            try{
                const resultado = await db.execute("CALL anadirUser(?,?,?,?,?,@sal)",[
                    idU,
                    tlf,
                    email,
                    idG,
                    admin
                ])

                const datos = await Promise.all([
                    db.query("SELECT @sal as salida"),
                    db.query("SELECT usuarios.nombre, usuarios.telefono, usuarios.email FROM pertenece inner join usuarios on pertenece.userid = usuario where grupoid = ?",
                        idG
                    )
                ])

                if(datos[0][0][0].salida == 0){
                    let mensaje = "Usuario dado de alta correctamente";

                    res.render("anadirU",{
                        titulo:"Añadir usuario",
                        identificado: identificacion(req),
                        datos: datos[1][0],
                        tipo: 0,
                        mensaje,
                        idG
                    })
                }
                else{
                    let mensaje = "No se ha dado de alta al usuario";

                    res.render("anadirU",{
                        titulo:"Añadir usuario",
                        identificado: identificacion(req),
                        datos: datos[1][0],
                        mensaje,
                        tipo: 1,
                        idG
                    })
                }
            }
            catch(err){
                console.error(err)
            }

        }
        else{

            try{
                
                const resultado = await usuariosGrupo(idG);

                let mensaje = "Debe rellenar al menos dos campos";

                res.render("anadirU",{
                    titulo:"Añadir usuario",
                    identificado: identificacion(req),
                    datos: resultado[0],
                    mensaje,
                    idG
                })
            }
            catch(err){
                console.error(err)
            }
            
        }
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const recuperacion = async(req,res) => {

}

async function grupos(usuario){
    const grupos = await db.query("select grupo.grupoid, nombre from pertenece inner join grupo on pertenece.grupoid = grupo.grupoid where pertenece.userid = ?",[
        usuario
    ])

    return grupos[0];
}

async function usuariosGrupo(idG) {
    return await db.query("SELECT usuarios.nombre, usuarios.telefono, usuarios.email FROM pertenece inner join usuarios on pertenece.userid = usuario where grupoid = ?",
        idG
    )
}

/**
 * 
 * @param {number} idG id del grupo 
 * @param {string} idP id del usuario
 * @returns Array [Gastos Medios, Situación Actual del usuario, Nombre del grupo, Datos de las operaciones realizadas, Datos de las personas en el grupo]
 */
async function datosG(idG,idP){
    await db.execute("CALL sActual (?,?,@sPersona, @sGrupo, @tPersonas)",[
        idG,
        idP
    ])

    let resultados = await Promise.all([
        db.query("SELECT @sPersona as sPersona, @sGrupo as sGrupo, @tPersonas as tPersonas"),
        db.query("SELECT nombre FROM grupo where grupoid = ?",[
            idG
        ]),
        db.query("SELECT idCompra,compra.nombre,compra.valor,compra.Comentario, tipo.nombre as 'Tipo' FROM  grupo inner join compra inner join tipo on grupo.grupoid = compra.idGrupo and compra.idTipo = tipo.idtipo where grupoid = ?",[
            idG
        ]),
        db.query("SELECT SUM(valor) as posicion, usuarios.nombre FROM usuarios LEFT JOIN compra ON usuarios.usuario = compra.usuario INNER JOIN pertenece ON usuarios.usuario = pertenece.userid WHERE pertenece.grupoid = ? and usuarios.usuario in(SELECT pertenece.userid from pertenece where pertenece.grupoid = ?) GROUP by usuarios.usuario ",[
            idG,
            idG
        ])
    ])

    let gMedios = resultados[0][0][0].sGrupo/resultados[0][0][0].tPersonas;

    let sActual = resultados[0][0][0].sPersona - gMedios;

    return [gMedios,sActual,resultados[1][0][0].nombre,resultados[2][0],resultados[3][0],resultados[0][0][0].tPersonas]
}



function identificacion(request){
    let salida = false
    if(request.session.usuario != "" & request.session.usuario != undefined){
        salida = true;
    }
    return salida;
}
function generarAleatorio(){
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let resultado = "";
    for (let i = 0; i < 8; i++) {
        resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
};

export{
    paginaInicio,
    paginaRegistro,
    paginaISesion,
    paginaFactura,
    paginaFacturaParams,
    pagCrearGrupo,
    paginaAnadir,
    iSesion,
    registro,
    verifica,
    cerrarSesion,
    volverPPrincial,
    crearGrupo,
    accesoGrupo,
    crearFactura,
    anadirParticipante,
    recuperacion,
    borrar
}