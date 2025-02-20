/* Aqui hay que importar los modelos que vayamos a usar */

import db from "../config/db.js"
import nodemailer from "nodemailer";

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

        console.log(rows[0])

        /*Comprobamos si existe el elemento que introducimos en la base de datos:
            1: el elemento existe -> ponemos falso para ir al if
            2: el elemento no existe -> ponemos true para ir al else
        */
        const existe = rows.existe == 1? true:false; 
        
        /*Si existe tenemos que mandar un email al email enviado*/
        if(existe){//Existe
            console.log("Existe, no se crea")
            res.render("registro",{
                titulo:"Registro",
                identificado: false
            })
        }else{//No existe
            console.log("No existe, se crea")
            //Enviamos un email con un link para activar la cuenta
            const transporter = nodemailer.createTransport({
                service: 'gmail',  // Usando Gmail como servicio de correo
                auth: {
                    user: 'marcosruizclemente@gmail.com', // Reemplaza con tu correo de Gmail
                    pass: 'vibh qivt ojji gwqp'         // Reemplaza con tu contraseña o una contraseña de aplicación
                }
            });

            console.log(rows.salida)
            const mailOptions = {
                from: `marcosruizclemente@gmail.com`,      // Remitente
                to: 'marcosruiz_8@hotmail.com',         // Destinatario
                subject: `Alta en Shared Control ` + entrada.user,  // Asunto
                text:
                    'Nombre: ' + entrada.user + '\n' +
                    'Correo: ' + entrada.email + '\n' +
                    'Teléfono: ' + entrada.telefono + '\n' +
                    "Link de activación: 127.0.0.1/" + rows.salida 
            };

            await transporter.sendMail(mailOptions);

            res.render("indice",{
                titulo:"Inicio",
                identificado: false
            })
        }
    }
    catch(err){
        //Si el error es el 1062 es q hay algo repetido que no se puede repetir (tlf y/o email)
        console.error(err.errno)
        if(err.errno == 1062){
            res.render("registro",{
                titulo:"Registro",
                identificado: false
            })
        }
    }

    
}

export{
    paginaInicio,
    paginaRegistro,
    registro
}