require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const upload = require('./config/cloudinary');


const app= express();
const PORT = process.envPORT ||3000;

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado a MongoDB exitosamente!'))
    .catch(err => console.error('Error al conectarse a MongoDB:', err));

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

//Archivos estaticos
//app.use(express.static(path.join(__dirname, 'public)));

//Rutas de la API
app.use('/api/productos', require('./routes/productos')(upload));
app.use('/api/carrito', require('./routes/carrito'));
app.use('/api/auth', require ('./routes/auth'));

app.use((err, req, res, next) => {
    console.error('#####################################################');
    console.error('ERROR GLOBAL CAPTURADO:');
    console.error('Mensaje:', err.message);
    console.error('Nombre del error:', err.name);
    if (err.kind) { // Para errores de Mongoose (como CastError)
        console.error('Tipo de error (Kind):', err.kind);
    }
    console.error('Stack Trace:', err.stack); // ¡Esto es CRUCIAL para depurar!
    console.error('Error completo (objeto):', err);
    console.error('#####################################################');

    // Manejo de errores específicos para Multer/Cloudinary si es necesario
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ mensaje: `Error al subir el archivo: ${err.message}` });
    }
    // Si el error es el que definimos en fileFilter
    if (err.statusCode === 400 && err.message === 'Solo se permiten archivos de imagen (JPG, PNG, GIF, etc.)') {
        return res.status(400).json({ mensaje: err.message });
    }
    // Para cualquier otro error no manejado
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        mensaje: 'Ocurrió un error inesperado en el servidor.',
        error: err.message,
        // En producción, evita enviar el stack trace completo al cliente por seguridad
        // stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});


app.listen(PORT, '0.0.0.0', () => { 
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT} (accesible en http://tu_ipv4_local:${PORT})`);
});