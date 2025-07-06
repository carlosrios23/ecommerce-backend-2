

const mongoose = require('mongoose');

// Definición de un solo ítem dentro del carrito
const CarritoItemSchema = new mongoose.Schema({
    productoId: { // Referencia al ID del Producto
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto', // Esto enlaza con el modelo 'Producto'
        required: true 
    },
    nombre: { 
        type: String,
        required: true
    },
    precio: { 
        type: Number,
        required: true
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1
    }
});

const CarritoSchema = new mongoose.Schema({
    usuario: { // Asocio el carrito a un usuario (¡muy importante para la lógica!)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        unique: true, // Así cada usuario tendrá solo un carrito asignado
        required: true
    },
    items: [CarritoItemSchema], // Array de ítems del carrito (cada uno con su productoId, nombre, precio, cantidad)
    
    // `fechaCreacion` y `fechaActualizacion` serán manejados por `timestamps: true`
    // No necesitas el middleware pre('save') para fechaActualizacion si usas timestamps.

}, { timestamps: true }); // 'timestamps' añade createdAt y updatedAt automáticamente

module.exports = mongoose.model('Carrito', CarritoSchema);