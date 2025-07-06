// ecommerce-backend-2/models/Usuario.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Esto es para encriptar clave

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required:true,
        unique: true, // Cada email es unico para cada usuario
        lowercase: true, // Solo lo guarda en minusculas
        trim: true,
        match: [/.+@.+\..+/, 'Por favor, introduce un email valido'] // Valida el formato del email
    },
    password:{
        type: String,
        required: true,
        minlength:6 // Minimo 6 caracteres para la clave
    },
    role:{ 
        type: String,
        enum:['user', 'admin'], 
        default: 'user' 
    },
    fechaRegistro: {
        type: Date,
        default:Date.now
    }
}, {timestamps: true});

// Middleware de Mongoose para encriptar las claves antes de guardar el usuario
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('password')) { // Solo encripta si la clave ha sido modificada
        next();
    }
    const salt = await bcrypt.genSalt(10); // Genera un 'salt' para la encriptacion
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Comparar la clave ingresada con la encriptada
usuarioSchema.methods.matchPassword = async function(passwordIngresada) {
    return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model ('Usuario', usuarioSchema);