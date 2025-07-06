const express = require ('express');
const router = express.Router();
const authController = require ('../controllers/authController');

//Ruta para registrar nuevo usuario
//POST /api/auth/registro
router.post('/registro', authController.registrarUsuario);

//Ruta para iniciar sesion
//POST /api/auth/login
router.post('/login', authController.iniciarSesion);

module.exports = router;