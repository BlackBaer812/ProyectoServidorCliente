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

    try{
        await db.execute("CALL iSesion(?,?,@salida)",[
            req.body.usuario,
            req.body.password
        ])

        const [rows] = await db.execute("SELECT @salida AS salida");

        console.log(rows[0].salida)
        const autentificado = rows[0].salida == 1? true:false;
        
        if(autentificado){
            req.session.usuario = req.body.usuario;

            res.send("Identificado como: " + req.session.usuario)
        }
        else{
            
            res.render("iSesion",{
                titulo: "Inicio de sesión",
                identificado: identificacion(req),
                mensaje: true,
                usuario: req.body.usuario,
                password: req.body.password
            })
        }
        
    }
    catch(err){
        console.error(err)
    }
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

    const generarAleatorio = () => {
        const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let resultado = "";
        for (let i = 0; i < 8; i++) {
            resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        return resultado;
    };
    
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

const recuperacion = async(req,res) => {

}

function identificacion(request){
    let salida = false
    if(request.session.usuario != "" & request.session.usuario != undefined){
        salida = true;
    }
    return salida;
}

export{
    paginaInicio,
    paginaRegistro,
    paginaISesion,
    iSesion,
    registro,
    verifica,
    recuperacion
}