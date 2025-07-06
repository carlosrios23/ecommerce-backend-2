// ecommerce-backend-2/controllers/productosController.js

const Producto = require('../models/Producto'); // Este es el modelo de producto
const cloudinary = require('cloudinary').v2; // Importa Cloudinary para eliminar imágenes

function extractPublicIdFromCloudinaryUrl(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex > -1 && parts.length > uploadIndex + 1) {
        // The public ID starts after '/upload/' and potentially after a version number (e.g., 'v12345')
        let publicIdStartIndex = uploadIndex + 1;
        if (parts[publicIdStartIndex] && parts[publicIdStartIndex].startsWith('v')) {
            publicIdStartIndex++; // Skip the version number part
        }
        // Join the remaining parts and remove the file extension
        let publicId = parts.slice(publicIdStartIndex).join('/');
        const dotIndex = publicId.lastIndexOf('.');
        if (dotIndex > -1) {
            publicId = publicId.substring(0, dotIndex);
        }
        return publicId;
    }
    return null;
}


// Obtener todos los productos
const obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.find();
        res.status(200).json(productos);
    } catch (error) {
        console.error('Error al obtener los productos:', error.message); // Mejorar el log
        res.status(500).json({ mensaje: 'Error al obtener los productos, lo sentimos', error: error.message });
    }
};

// Obtener Productos por el ID
const obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id); // Solo busca el producto por ID
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        console.error('Error al obtener producto por ID:', error.message);
        // En caso de que el ID no sea válido para MongoDB (ej. formato incorrecto), lanza un 500 o 400
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de producto inválido', error: error.message });
        }
        res.status(500).json({ mensaje: 'Error al obtener el producto', error: error.message });
    }
};

// Crear un nuevo producto
const crearProducto = async (req, res) => {
    const {
        nombre,
        descripcion,
        precio,
        stock,
        categoria,
        porcentajeDescuento,
        fechaInicioDescuento,
        fechaFinDescuento
    } = req.body;

    let imagenUrl = null;
    if (req.file) { // Si Multer procesó un archivo, su información estará en req.file
        imagenUrl = req.file.path; // Asume que req.file.path es la URL de Cloudinary
    }

    // Simple validación de campos requeridos
    if (!nombre || !descripcion || !precio || !stock) {
        return res.status(400).json({ mensaje: 'Por favor, introduce todos los campos requeridos: nombre, descripción, precio y stock.' });
    }

    try {
        const nuevoProducto = new Producto({
            nombre,
            descripcion,
            // Se asegurara de parsear a números. Si el frontend envía string vacío, parseFloat('') es NaN
            precio: parseFloat(precio),
            stock: parseInt(stock, 10),
            imagen: imagenUrl, // Guarda la URL/ruta de la imagen
            categoria,
            // Convertir a null si el string está vacío y parsear a Float para porcentaje
            porcentajeDescuento: porcentajeDescuento === '' ? null : parseFloat(porcentajeDescuento),
            // Convertir a Date object o null si el string está vacío
            fechaInicioDescuento: fechaInicioDescuento === '' ? null : new Date(fechaInicioDescuento),
            fechaFinDescuento: fechaFinDescuento === '' ? null : new Date(fechaFinDescuento)
        });

        const productoGuardado = await nuevoProducto.save();
        res.status(201).json(productoGuardado);
    } catch (error) {
        console.error("Error en crearProducto:", error.message);
        // Manejar errores de validación de Mongoose más específicamente
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensaje: error.message, errores: error.errors });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al crear el producto.', error: error.message });
    }
};

// Actualizar producto por ID
const actualizarProducto = async (req, res) => {
    const {
        nombre,
        descripcion,
        precio,
        stock,
        categoria,
        porcentajeDescuento,
        fechaInicioDescuento,
        fechaFinDescuento
    } = req.body;

    // Inicializamos un objeto para las actualizaciones
    const updates = {};

    // Asignar los campos si están presentes en el body
    if (nombre !== undefined) updates.nombre = nombre;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    // Parsear a número solo si no es undefined o null y no es un string vacío para el parseo
    if (precio !== undefined && precio !== '') updates.precio = parseFloat(precio);
    if (stock !== undefined && stock !== '') updates.stock = parseInt(stock, 10);
    if (categoria !== undefined) updates.categoria = categoria;

    // Lógica para la imagen:
    if (req.file) {
        // Si se subió un nuevo archivo, Multer lo pondrá aquí. Usamos la nueva URL.
        updates.imagen = req.file.path;
        //  NO SE ELIMINA LA IMAGEN ANTERIOR DE CLOUDINARY AQUÍ.
        // Cloudinary creará una nueva imagen. La antigua permanecerá en cloudinary.
    }
    // Si no se subió un nuevo archivo, el campo 'imagen' no se incluye en 'updates',
    // por lo que el valor existente en la base de datos se mantiene.

    // Campos de descuento: manejar cadenas vacías como null
    updates.porcentajeDescuento = porcentajeDescuento === '' ? null : parseFloat(porcentajeDescuento);
    updates.fechaInicioDescuento = fechaInicioDescuento === '' ? null : new Date(fechaInicioDescuento);
    updates.fechaFinDescuento = fechaFinDescuento === '' ? null : new Date(fechaFinDescuento);

    try {
        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            updates, // Usamos el objeto 'updates' que contiene solo los campos a modificar
            { new: true, runValidators: true } // 'new: true' devuelve el doc actualizado; 'runValidators' ejecuta validaciones del esquema
        );

        if (!productoActualizado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Producto actualizado exitosamente', producto: productoActualizado });
    } catch (error) {
        console.error('Error al actualizar el producto:', error.message); // Esto ahora mostrará más detalle
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de producto inválido', error: error.message });
        }
        if (error.name === 'ValidationError') {
            // Muestra los errores de validación de Mongoose
            return res.status(400).json({ mensaje: 'Error de validación al actualizar el producto.', errores: error.errors });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar el producto.', error: error.message });
    }
};

// Eliminar producto por ID
const eliminarProducto = async (req, res) => {
    try {
        const productoAObtenerImagen = await Producto.findById(req.params.id);

        if (!productoAObtenerImagen) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }

     
        if (productoAObtenerImagen.imagen) { // Si el producto tiene una imagen asociada
            try {
                const publicId = extractPublicIdFromCloudinaryUrl(productoAObtenerImagen.imagen);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`Imagen con public_id ${publicId} eliminada de Cloudinary.`);
                } else {
                    console.warn(`No se pudo extraer public_id de la URL: ${productoAObtenerImagen.imagen}. La imagen podría no ser de Cloudinary o la URL es inválida.`);
                }
            } catch (cloudinaryError) {
                console.error('Error al intentar eliminar la imagen de Cloudinary:', cloudinaryError);
                // No detenemos la eliminación del producto de la DB si falla la eliminación de la imagen
  
            }
        }
     

      
        const productoEliminado = await Producto.findByIdAndDelete(req.params.id);

       
        if (productoEliminado) { // Verifica si se encontró y eliminó un producto
            res.json({ mensaje: 'Producto eliminado exitosamente' });
        } else {
            // Este caso es muy improbable si productoAObtenerImagen no fue nulo.
            res.status(404).json({ mensaje: 'Producto no encontrado después de intentar la eliminación.' });
        }

    } catch (error) {
        console.error('Error al eliminar el producto:', error.message);
        if (error.name === 'CastError') {
            return res.status(400).json({ mensaje: 'ID de producto inválido', error: error.message });
        }
        res.status(500).json({ mensaje: 'Error del servidor al eliminar el producto.', error: error.message });
    }
};

module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};