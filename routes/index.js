import express from 'express';

const router = express.Router();


router.get('/', (req, res) => {
    res.render('indice', {});
});


export default router;