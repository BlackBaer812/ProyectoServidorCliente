import express from 'express';
import { cerrarSesion, pagCrearGrupo, iSesion, paginaInicio, paginaISesion, paginaRegistro, recuperacion, registro, verifica, volverPPrincial, crearGrupo, accesoGrupo } from '../controllers/paginaControllers.js';

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


export default router;