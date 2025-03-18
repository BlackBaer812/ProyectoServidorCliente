import express from 'express';
import { cerrarSesion, pagCrearGrupo, iSesion, paginaInicio, paginaISesion, paginaRegistro, recuperacion, registro, verifica, volverPPrincial, crearGrupo, accesoGrupo,crearFactura, paginaFactura, borrar, paginaFacturaParams, paginaAnadir, anadirParticipante, paginaUsuario, aceptarInvitacion, rechazarInvitacion, paginaCerrar, cerrarGrupo, pagSiguiente, pagAnterior } from '../controllers/paginaControllers.js';

const router = express.Router();


router.get('/', paginaInicio);

router.get("/registro", paginaRegistro)

router.post("/registro", registro)

router.get("/verificacion/:verificacion/:usuario", verifica)

router.get("/iSesion", paginaISesion)

router.post("/iSesion", iSesion)

router.get("/recuperacion", recuperacion)

router.get("/cerrarSesion",cerrarSesion)

router.get("/crearGrupo",pagCrearGrupo)

router.post("/crearGrupo",crearGrupo)

router.get("/volver", volverPPrincial)

router.get("/accesoGrupo/:idGrup", accesoGrupo)

router.get("/paginaFactura",paginaFactura)

router.get("/paginaFactura/:idG",paginaFacturaParams)

router.post("/crearfactura",crearFactura)

router.get("/borrar/:idCompra",borrar)

router.get("/anadirUser",paginaAnadir)

router.post("/anadirUser",anadirParticipante)

router.get("/paginaUsuario/:idUsuario",paginaUsuario)

router.get("/aceptar/:idGrupo",aceptarInvitacion)

router.get("/rechazar/:idGrupo",rechazarInvitacion)

router.get("/cerrarGrupo",paginaCerrar)

router.post("/cerrarGrupo",cerrarGrupo)

router.get("/siguientePag",pagSiguiente)

router.get("/anteriorPag",pagAnterior)

export default router;