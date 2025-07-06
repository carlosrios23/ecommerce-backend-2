

const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Registrar nuevo usuario
const registrarUsuario = async (req, res) => {
   
    const {nombre, email, password } = req.body; 

    try {
        // Verificar si el usuario ya existe por medio del Email
        let usuarioExistente = await Usuario.findOne({ email });
        if(usuarioExistente) {
            return res.status(400).json({ mensaje: 'El mail ya esta registrado'});
        }

        let assignedRole = 'user'; // Por defecto, cualquier registro será 'user'

        // Lógica para asignar rol de admin para un email específico
        if (email === 'carlosriosrivera23@gmail.com') { 
            assignedRole = 'admin'; // Asigna 'admin' si el email coincide
        }
  
        // Crear un nuevo usuario
        const nuevoUsuario = new Usuario ({
            nombre, 
            email,
            password, // La encriptacion se hara automaticamente por el middleware 'pre save' 
            role: assignedRole 
        });

        await nuevoUsuario.save();

        // Generar un JWT para el usuario recién registrado
        const token = jwt.sign(
            { id: nuevoUsuario._id, role: nuevoUsuario.role}, 
            JWT_SECRET,
            { expiresIn: '8d'} // El token expira en 1 día
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                role: nuevoUsuario.role 
            }
        });

    } catch (error) {
        console.error("Error al registrar el usuario:", error); // Mejor log para depuración
        res.status(500).json({ mensaje: 'Error al registrar el usuario', error: error.message});
    }
};

// Iniciar sesion de Usuario
const iniciarSesion = async (req, res) => {
    const { email, password } = req.body;

    try{
        // Verificar si el usuario existe por su email
        const usuario = await Usuario.findOne ({ email });
        if (!usuario) {
            return res.status(400).json ({mensaje: 'Credenciales invalidas (Email o contraseña incorrectos)'});
        }
        
        // Comparar la contraseña ingresada con la encriptada usando el método del modelo
        const isMatch = await usuario.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ mensaje:'Credenciales invalidas (Email o contraseña incorrectos)'});
        }
        
        console.log('Hora actual del servidor al generar token:', new Date().toLocaleString()); // Formato más legible

        // De ser correctas las credenciales entonces generar un JWT
        const token = jwt.sign(
            { id: usuario._id, role: usuario.role}, 
            JWT_SECRET,
            { expiresIn: '1d'}
        );

        res.status(200).json({
            mensaje:'Inicio de sesion exitoso',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                role: usuario.role 
            }
        });
    } catch (error) {
        console.error("Error al iniciar sesion:", error); // Mejor log para depuración
        res.status(500).json({ mensaje: 'Error al iniciar sesion', error: error.message});
    }
};

module.exports = {
    registrarUsuario,
    iniciarSesion
};