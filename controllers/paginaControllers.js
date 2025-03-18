/* Aqui hay que importar los modelos que vayamos a usar */

import db from "../config/db.js"
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import fs from "fs";
import sharp from 'sharp';
import pdfTable from "pdfkit-table";

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

/**
 * Pagina de principal de usuario (se muestran las opciones de usuario)
 * @param {*} req 
 * @param {*} res 
 */
const iSesion = async(req,res)=>{

    if(req.session.usuario != undefined){
        const envio = await grupos(req.session.usuario);
        
        let idU = req.session.usuario;

        delete req.session.grupo;
        delete req.session.admin;

        /*
        Consulta de los grupos que no hemos aceptado aún
        */
        const alerta = await db.query("SELECT grupo.nombre, grupo.grupoid FROM grupo inner join pertenece on grupo.grupoid = pertenece.grupoid where pertenece.aceptado = 0 and pertenece.userid = ?",[
            idU
        ]);

        let sit = alerta[0].length>0?"red":"black";

        res.locals.alerta = sit;
        req.session.alerta = sit;

        res.render("principal", {
            titulo: "Pagina de usuario",
            identificado: identificacion(req),
            grupos: envio,
            idU
        })
    }
    else if(req.body.usuario == undefined){
        res.render("iSesion",{
            titulo: "Inicio de sesión",
            identificado: identificacion(req),
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

                let idU = req.session.usuario;

                /**
                 * Consulta de los grupos que no hemos aceptado aún
                 */
                const resultado = await Promise.all([
                    db.query("SELECT grupo.nombre, grupo.grupoid FROM grupo inner join pertenece on grupo.grupoid = pertenece.grupoid where pertenece.aceptado = 0 and pertenece.userid = ?",[
                        idU
                    ]),
                    grupos(req.session.usuario)
                ])

                let alerta = resultado[0][0].length>0?"red":"black";

                req.session.alerta = alerta;
                res.locals.alerta = alerta;

                /**
                 * Consulta de los grupos aceptados
                 */
                const envio = resultado[1];

                res.render("principal", {
                    titulo: "Pagina de usuario",
                    identificado: identificacion(req),
                    grupos: envio,
                    idU
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
            identificado: identificacion(req),
            idU: req.session.usuario
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

        let idU = req.session.usuario;
        
        const alerta = await db.query("SELECT grupo.nombre, grupo.grupoid FROM grupo inner join pertenece on grupo.grupoid = pertenece.grupoid where pertenece.aceptado = 0 and pertenece.userid = ?",[
            idU
        ]);

        let sit = alerta[0].length>0?"red":"black";

        res.locals.alerta = sit;
        req.session.alerta = sit;

        res.render("principal",{
            titulo: "Pagina de usuario",
            identificado: identificacion(req),
            grupos: envio,
            idU
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
                grupos: envio,
                idU: user
            })
        }
        catch(err){
            console.error(err)
            
            await redirectPagPrincipal(req,res)
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

            req.session.admin = resultado[6];

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
                    idU:idP,
                    admin: resultado[6]
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
                    idU:idP,
                    admin: resultado[6]
                })
            }
        }
        catch(err){
            console.error(err)
            
            await redirectPagPrincipal(req,res)
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
        let idU = req.session.usuario;
        const admin = req.session.admin;

        try{
            let resp = await db.query("SELECT * FROM tipo");

            res.render("aFactura",{
                titulo:"Crear factura",
                identificado: identificacion(req),
                tipos: resp[0],
                idG:req.session.grupo,
                idU,
                admin
            })
        }
        catch(err){
            console.error(err)
            
            await redirectPagPrincipal(req,res)
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
        let idU = req.session.usuario;
        const admin = administrador(idU,req.params.idG);

        req.session.grupo = req.params.idG;
        try{
            let resp = await db.query("SELECT * FROM tipo");

            res.render("aFactura",{
                titulo:"Crear factura",
                identificado: identificacion(req),
                tipos: resp[0],
                idG:req.session.grupo,
                idU,
                admin
            })
        }
        catch(err){
            console.error(err)
            
            await redirectPagPrincipal(req,res)
        }
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req),
            idU
        })
    }
}

const crearFactura = async(req,res) =>{
    if(identificacion(req)){
        let idU = req.session.usuario;
        let idG = req.session.grupo;
        
        const admin = req.session.admin;

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
                    idG,
                    idU,
                    admin

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
                    idG,
                    idU,
                    admin
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
                idG,
                idU,
                admin
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
                    sActual: resultado[1],
                    gMedios : resultado[0],
                    datos: resultado[3],
                    datosP: resultado[4],
                    borrado: salida[0].affectedRows,
                    idU:idP,
                    admin: resultado[6]
                })
            }
            else{
                res.render("grupoP",{
                    titulo:"Pagina del grupo " + resultado[2],
                    identificado: identificacion(req),
                    borrado: salida[0].affectedRows,
                    idG,
                    idU:idP,
                    admin: resultado[6]
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
                    idU:idP,
                    admin: resultado[6]
                })
            }
            else{
                res.render("grupoP",{
                    titulo:"Pagina del grupo " + resultado[2],
                    identificado: identificacion(req),
                    idU:idP,
                    admin: resultado[6]
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
            const resultado = await db.query("SELECT usuarios.nombre, usuarios.telefono, usuarios.email FROM pertenece inner join usuarios on pertenece.userid = usuario where grupoid = ? and pertenece.activo = 1",
                idG
            )

            const admin = req.session.admin;

            res.render("anadirU",{
                titulo:"Añadir usuario",
                identificado: identificacion(req),
                datos: resultado[0],
                idG,
                idU: req.session.usuario,
                admin
            })
        }
        catch(err){
            console.error(err)

            await redirectPagPrincipal(req,res)
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
        const idU = req.session.usuario;
        const admi = req.session.admin;

        if(body.telefono != "" || body.email != ""){

            const tlf = req.body.telefono == 0 ? null: req.body.telefono;
            const email = req.body.email;
            const admin = req.body.admin == "on" ? 1:0;

            try{
                await db.execute("CALL anadirUser(?,?,?,?,?,@sal)",[
                    req.body.usuario,
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
                        idG,
                        idU,
                        admin:admi
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
                        idG,
                        idU,
                        admin:admi
                    })
                }
            }
            catch(err){
                console.error(err)

                await redirectPagPrincipal(req,res)
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
                    idG,
                    idU,
                    admin: admi
                })
            }
            catch(err){
                console.error(err)

                await redirectPagPrincipal(req,res)
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

const paginaUsuario = async(req,res) =>{
    if(identificacion(req)){

        delete req.session.admin;
        delete req.session.grupo;

        try{

            const resultado = await db.query("SELECT grupo.nombre, grupo.grupoid FROM grupo inner join pertenece on grupo.grupoid = pertenece.grupoid where pertenece.aceptado = 0 and pertenece.userid = ?",[
                req.params.idUsuario
            ])

            res.render("pagUsuario",{
                titulo:"Opciones de usuario",
                identificado: identificacion(req),
                idU: req.session.usuario,
                datos: resultado[0]
            })

        }
        catch(err){
            console.error(err)

            await redirectPagPrincipal(req,res)
        }
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const aceptarInvitacion = async(req,res) =>{

    if(identificacion(req)){

        let idG = req.params.idGrupo;
        let idU = req.session.usuario;

        try{
            const datos = await Promise.all([
                db.execute("CALL procAcepRech(?,?,1)",[
                    idG,
                    idU
                ]),
                db.query("SELECT grupo.nombre, grupo.grupoid FROM grupo inner join pertenece on grupo.grupoid = pertenece.grupoid where pertenece.aceptado = 0 and pertenece.userid = ?",[
                    idU
                ])
            ])

            if(datos[1][0].length == 0){
                res.locals.alerta = "black"
                req.session.alerta = "black";
            }

            res.render("pagUsuario",{
                titulo:"Opciones de usuario",
                identificado: identificacion(req),
                idU: req.session.usuario,
                datos: datos[1][0]
            })
        }
        catch(err){
            console.error(err)

            await redirectPagPrincipal(req,res)
        }


    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }

}

const rechazarInvitacion = async(req,res) =>{

    if(identificacion(req)){

        let idG = req.params.idGrupo;
        let idU = req.session.usuario;

        try{
            const datos = await Promise.all([
                db.execute("CALL procAcepRech(?,?,0)",[
                    idG,
                    idU
                ]),
                db.query("SELECT grupo.nombre, grupo.grupoid FROM grupo inner join pertenece on grupo.grupoid = pertenece.grupoid where pertenece.aceptado = 0 and pertenece.userid = ?",[
                    idU
                ])
            ])

            if(datos[1][0].length == 0){
                res.locals.alerta = "black"
                req.session.alerta = "black";
            }

            res.render("pagUsuario",{
                titulo:"Opciones de usuario",
                identificado: identificacion(req),
                idU: req.session.usuario,
                datos: datos[1][0]
            })
        }
        catch(err){
            console.error(err)

            await redirectPagPrincipal(req,res)
        }


    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }

}

const paginaCerrar = async(req,res) => {
    if(identificacion(req)){

        const idG = req.session.grupo;
        const idU = req.session.usuario;

        const admin = req.session.admin;

        res.render("cerrarGrupo",{
            titulo:"Cerrar grupo",
            identificado: identificacion(req),
            idU,
            idG,
            admin
        })
    }
    else{
        res.render("indice",{
            titulo:"Inicio",
            identificado: identificacion(req)
        })
    }
}

const cerrarGrupo = async(req,res) => {
    if(identificacion(req)){

        const idG = req.session.grupo;
        const idU = req.session.usuario;
        const admin = req.session.admin;

        if(req.body.usuarioEli == idU){

            await db.execute("CALL iSesion(?,?,@salida)", [
                req.body.usuarioEli,
                req.body.password
            ])

            const rows = await db.execute("SELECT @salida AS salida");

            if(rows[0][0].salida == 1){

                try{
                    await db.execute("CALL sActual (?,?,@sPersona, @sGrupo, @tPersonas)",[
                        idG,
                        idU
                    ])
                    
                    let resultados = await Promise.all([
                        db.query("SELECT @sPersona as sPersona, @sGrupo as sGrupo, @tPersonas as tPersonas"),
                        db.query("SELECT nombre FROM grupo where grupoid = ?",[
                            idG
                        ]),
                        db.query("SELECT idCompra,compra.nombre,compra.valor,compra.Comentario, tipo.nombre as 'Tipo' FROM  grupo inner join compra inner join tipo on grupo.grupoid = compra.idGrupo and compra.idTipo = tipo.idtipo where grupoid = ?",[
                            idG
                        ]),
                        db.query(`Select sum(compra.valor) as 'posicion', usuarios.usuario, usuarios.nombre
                            from compra
                            INNER join usuarios
                            on usuarios.usuario = compra.usuario
                            where compra.idGrupo = ?
                            GROUP by compra.usuario`,[
                            idG
                        ]),
                        db.query(`SELECT pertenece.userid, usuarios.nombre, usuarios.email
                            from pertenece
                            INNER JOIN usuarios
                            on usuarios.usuario = pertenece.userid
                            where pertenece.grupoid = ?
                            AND pertenece.activo = 1`,[
                            idG
                        ]),
                        db.query("SELECT nombre FROM grupo where grupoid = ?",[
                            idG
                        ]),
                        db.query("SELECT email FROM pertenece inner join usuarios on pertenece.userid = usuarios.usuario where grupoid = ? and activo = 1",[
                            idG
                        ])
                    ])
                
                    let gMedios = resultados[0][0][0].sGrupo/resultados[0][0][0].tPersonas;
                
                    let sActual = resultados[0][0][0].sPersona - gMedios;

                    let posicion = []
                    
                    resultados[4][0].forEach(persona =>{
                        posicion.push({
                            posicion:resultados[3][0].find(element => element.usuario == persona.userid)? resultados[3][0].find(element => element.usuario == persona.userid).posicion- gMedios:0-gMedios,
                            nombre: persona.nombre,
                            usuario: persona.userid,
                            email: persona.email
                        })
                    })

                    let debe = []
                    
                    for(let i = 0; i<posicion.length;i++){
                        if(posicion[i].posicion < 0){
                            let continua = true;
                            for(let j = 0; j<posicion.length && continua; j++){
                                if(posicion[j].posicion > 0){
                                    console.log(posicion[i].posicion,posicion[j].posicion)
                                    let cantidad = posicion[i].posicion + posicion[j].posicion;
                                    
                                    debe.push({
                                        deuda: posicion[j].posicion,
                                        deudorN: posicion[i].nombre,
                                        deudor: posicion[i].usuario,
                                        acreedirN: posicion[j].nombre,
                                        acreedor: posicion[j].usuario
                                    })
                                    posicion[i].posicion -= cantidad;
                                    posicion[j].posicion -= cantidad;

                                    if(posicion[i].posicion == 0){
                                        continua = false;
                                    }
                                }
                            }
                        }
                    }

                    const svgContent = `
                                        <svg width="100" height="100" viewBox="0 0 258 258" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="258" height="258" rx="20" fill="#0AFA62"></rect>
                                            <circle cx="89" cy="94" r="25" fill="#FA5A0A"></circle>
                                            <circle cx="169" cy="94" r="25" fill="#FA5A0A"></circle>
                                            <path d="M84 144 Q129 184, 174 144" stroke="#FA5A0A" stroke-width="10" fill="none"></path>
                                            <text x="129" y="228" font-size="36" font-family="Arial" fill="#FA5A0A" text-anchor="middle">Shared Control</text>
                                        </svg>
                                    `;

                    const imagen = await crearImagen(svgContent);

                    const imagenSrc = `data:image/png;base64,${imagen.toString('base64')}`;

                    const pdf = await crearPDF(debe, svgContent);

                    const emails = resultados[6][0].map(element => element.email);
                    
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',  // Usando Gmail como servicio de correo
                        auth: {
                            user: 'marcosruizclemente@gmail.com', // Reemplaza con tu correo de Gmail
                            pass:  process.env.CONTRA_EMAIL // Reemplaza con tu contraseña o una contraseña de aplicación
                        }
                    });
                    
                    emails.forEach(async email => {
                        const mailOptions = {
                            from: `marcosruizclemente@gmail.com`,      // Remitente
                            to: email,         // Destinatario
                            subject: `Situación actual del grupo: ` + resultados[5][0][0].nombre,  // Asunto
                            // text:x
                            //     'Nombre: ' + entrada.user + '\n' +
                            //     'Correo: ' + entrada.email + '\n' +
                            //     'Teléfono: ' + entrada.telefono + '\n'
                            // ,
                            html:`<img src = `+ imagenSrc + `></img>
                            <p>La situación actual del grupo es de ${sActual.toFixed(2)} €. A continuación se adjunta un pdf con las deudas actuales.<p>`,
                            attachments:[
                                {
                                    filename: 'deudas.pdf',
                                    content: pdf
                                }
                            ]
                        };
                        try{
                            await transporter.sendMail(mailOptions);
                        }
                        catch(err){
                            console.error(err)
                        }
                    })

                    redirectPagPrincipal(req,res);

                }
                catch(err){
                    console.error(err)
                }
                
            }
            else{
                const mensaje = "Error al validar contraseña y usuario";

                res.render("cerrarGrupo",{
                    titulo:"Cerrar grupo",
                    identificado: identificacion(req),
                    idU,
                    idG,
                    admin,
                    mensaje
                })
            }
        }
        else{
            const mensaje = "El usuario con el que estas intentando cerrar el grupo no coincide con el usuario con el que has iniciado sesión";

            res.render("cerrarGrupo",{
                titulo:"Cerrar grupo",
                identificado: identificacion(req),
                idU,
                idG,
                admin,
                mensaje
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

const recuperacion = async(req,res) => {

}

async function crearImagen(svgContent){
    const svgBuffer = Buffer.from(svgContent);
    const pngBuffer = await sharp(svgBuffer).png().toBuffer();
    return pngBuffer
}

async function crearPDF(datos, svgContent){

    const pngBuffer = await crearImagen(svgContent); 

    return new Promise((resolve,reject) =>{
        const doc = new pdfTable();

        let buffer = [];

        doc.on('data', buffer.push.bind(buffer));
        doc.on('end', () => {
            const pdf = Buffer.concat(buffer);
            resolve(pdf);
        })
        
        if (pngBuffer) {
            doc.image(pngBuffer, 50, 50, { width: 100 });
        }

        doc.fontSize(20).text("Resumen de Deudas", { align: "center" });
        doc.moveDown(5);

        const tabla = {
            headers: ["Deudor", "Acreedor", "Cantidad (€)"],
            rows: datos.map((element) => [
                element.deudorN.charAt(0).toUpperCase() + element.deudorN.slice(1),
                element.acreedirN.charAt(0).toUpperCase() + element.acreedirN.slice(1),
                element.deuda.toFixed(2) + "€",
            ]),
        };

        doc.table(tabla, { width: 500 });

        doc.end();
    })
}

/**
 * Función para consultar los grupos que hemos aceptado
 * @param {String} usuario 
 * @returns {Array} Array de objetos con los grupos que hemos aceptado
 */
async function grupos(usuario){
    const grupos = await db.query("select grupo.grupoid, nombre from pertenece inner join grupo on pertenece.grupoid = grupo.grupoid where pertenece.userid = ? and pertenece.aceptado = 1 and pertenece.activo = 1",[
        usuario
    ])

    return grupos[0];
}

async function usuariosGrupo(idG) {
    return await db.query("SELECT usuarios.nombre, usuarios.telefono, usuarios.email FROM pertenece inner join usuarios on pertenece.userid = usuario where grupoid = ?",
        idG
    )
}


async function redirectPagPrincipal(req,res){
    const envio = await grupos(req.session.usuario);

    let idU = req.session.usuario;

    res.render("principal",{
        titulo: "Pagina de usuario",
        identificado: identificacion(req),
        grupos: envio,
        idU
    })
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
        db.query(`Select sum(compra.valor) as 'posicion', usuarios.usuario, usuarios.nombre
            from compra
            INNER join usuarios
            on usuarios.usuario = compra.usuario
            where compra.idGrupo = ?
            GROUP by compra.usuario`,[
            idG
        ]),
        db.query(`SELECT pertenece.userid, usuarios.nombre, pertenece.admin
            from pertenece
            INNER JOIN usuarios
            on usuarios.usuario = pertenece.userid
            where pertenece.grupoid = ?
            AND pertenece.activo = 1`,[
            idG
        ])
    ])

    let gMedios = resultados[0][0][0].sGrupo/resultados[0][0][0].tPersonas;

    let sActual = resultados[0][0][0].sPersona - gMedios;

    let admin = resultados[4][0].find(element => element.userid == idP).admin == 1?true:false;
    
    let posicion = []
    
    resultados[4][0].forEach(persona =>{
        posicion.push({
            posicion:resultados[3][0].find(element => element.usuario == persona.userid)? resultados[3][0].find(element => element.usuario == persona.userid).posicion- gMedios:0-gMedios,
            nombre: persona.nombre,
            usuario: persona.userid,
            email: persona.email
        })
    })

    return [gMedios,sActual,resultados[1][0][0].nombre,resultados[2][0],posicion,resultados[0][0][0].tPersonas,admin]
}

async function administrador(idG,idU){
    let admin = await db.query(`SELECT pertenece.admin
        from pertenece
        INNER JOIN usuarios
        on usuarios.usuario = pertenece.userid
        where pertenece.grupoid = ?
        AND pertenece.userid = ?
        AND pertenece.activo = 1`,[
        idG,
        idU
    ])

    admin = admin[0] == 1?true:false;

    return admin;
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
    paginaUsuario,
    paginaCerrar,
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
    borrar,
    aceptarInvitacion,
    rechazarInvitacion,
    cerrarGrupo
}