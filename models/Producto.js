const mongoose = require ('mongoose');

const productoSchema = new mongoose.Schema({
    nombre: {
        type:String,
        required:true,
        trim:true
    },
    descripcion:{
        type:String,
        required:true,
        trim:true
    },
    precio:{
        type:Number,
        required:true,
        min: 0 
    },
    stock:{
        type: Number,
        required: true,
        min:0
    },
    imagen:{
        type:String,
        required:false
    },
    precioDescuento: {//El precio finla despues del descuento
        type: Number,
        min: 0,
        required: false //ASi se aplicara solo si hay descuento

    },
    porcentajeDescuento: { 
        type: Number,
        min: 0,
        max: 100,
        required: false
    },
    fechaInicioDescuento:{
        type: Date,
        required: false

    },
    fechaFinDescuento:{
        type: Date,
        required: false
        
    },
    categoria:{
        type:String,
        Required:true,
        trim:true
    },
    fechaCreacion:{
        type:Date,
        default:Date.now
    }
}, {
    timestamps: true
}); //Esto agrega createdAt y updatedAt de forma automatica

productoSchema.pre('save', function(next) {
    // Solo aplica si hay un porcentaje de descuento y las fechas son válidas
    const now = new Date();
    if (this.porcentajeDescuento > 0 && 
        this.fechaInicioDescuento && this.fechaFinDescuento &&
        this.fechaInicioDescuento <= now && this.fechaFinDescuento >= now) {
        
        this.precioDescuento = this.precio * (1 - this.porcentajeDescuento / 100);
        
        if (this.precioDescuento < 0) this.precioDescuento = 0;
    } else {
        this.precioDescuento = undefined; // Elimina el campo si no hay descuento activo
    }
    next();
});

module.exports = mongoose.model('Producto', productoSchema);