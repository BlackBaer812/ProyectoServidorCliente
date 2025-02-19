import express from 'express';
import { paginaInicio, paginaRegistro, registro } from '../controllers/paginaControllers.js';

const router = express.Router();


router.get('/', paginaInicio);

router.get("/registro", paginaRegistro)

router.post("/registro", registro)


export default router;