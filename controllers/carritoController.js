// ecommerce-backend-2/controllers/carritoController.js

const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto'); // Necesitamos el modelo de Producto

// 1. Obtener el carrito de un usuario (o crear uno si no existe)
const obtenerOCrearCarrito = async (req, res) => {
    const userId = req.usuario.id; // ¡Asumo que req.usuario.id está disponible desde el middleware de autenticación!

    try {

        let carrito = await Carrito.findOne({ usuario: userId }); 

        if (!carrito) {
            // Si no existe carrito para este usuario, crea uno
            carrito = new Carrito({ usuario: userId, items: [] });
            await carrito.save();
            return res.status(201).json(carrito); // Creado y devuelto
        }

        res.status(200).json(carrito);
    } catch (error) {
        console.error("Error al obtener o crear el carrito:", error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener o crear el carrito.', error: error.message});
    } 
};

// 2. Agregar un producto al carrito
const agregarProductoAlCarrito = async (req, res) => {
    const userId = req.usuario.id;
    const { productoId, cantidad } = req.body;

    try {
        let carrito = await Carrito.findOne({ usuario: userId });

        if (!carrito) {
            return res.status(404).json({ mensaje: 'Carrito no encontrado para este usuario.' });
        }

        const productoExistente = await Producto.findById(productoId);
        if (!productoExistente) {
            return res.status(404).json({ mensaje: 'Producto no encontrado en el catálogo.' });
        }

        if (productoExistente.stock < cantidad) {
            return res.status(400).json({ mensaje: `No hay suficiente stock de ${productoExistente.nombre}. Stock disponible: ${productoExistente.stock}.`});
        }

        // Verifica si el producto ya está en el carrito
        const itemIndex = carrito.items.findIndex(item => item.productoId.toString() === productoId);

        if (itemIndex > -1) {
            // Si existe, actualizar la cantidad
            carrito.items[itemIndex].cantidad += cantidad;
        } else {
            // Si no existe, agregarlo con los campos necesarios
            carrito.items.push({ 
                productoId: productoExistente._id, 
                nombre: productoExistente.nombre, // Guardamos el nombre del producto
                precio: productoExistente.precio, // Guardamos el precio del producto
                cantidad 
            });
        }

        await carrito.save();
        res.status(200).json({ mensaje: 'Producto agregado al carrito exitosamente.', carrito });

    } catch (error) {
        console.error("Error al agregar producto al carrito:", error);
        res.status(500).json({ mensaje: 'Error interno del servidor al agregar producto al carrito.', error: error.message});
    }
};

// 3. Actualizar la cantidad de un producto en el carrito (o eliminarlo si la cantidad es 0)
const actualizarCantidadProducto = async (req, res) => {
    const userId = req.usuario.id;
    const { productoId } = req.params;
    const { cantidad } = req.body;

    try {
        let carrito = await Carrito.findOne ({ usuario: userId });

        if(!carrito){
            return res.status(404).json ({ mensaje: 'Carrito no encontrado para este usuario.' });
        }

        const itemIndex = carrito.items.findIndex(item => item.productoId.toString() === productoId);

        if (itemIndex === -1) {
            return res.status(404).json ({ mensaje:'Producto no encontrado en el carrito.' });
        }

        const productoExistente = await Producto.findById(productoId);
        if (!productoExistente) {
            return res.status(404).json({ mensaje: 'Producto en carrito no encontrado en el catálogo.' });
        }
        
        // Calcular la nueva cantidad después de la actualización (para la verificación de stock)
        const cantidadActual = carrito.items[itemIndex].cantidad;
        const cantidadDiferencia = cantidad - cantidadActual;

        if (cantidadDiferencia > 0 && productoExistente.stock < cantidadDiferencia) {
            return res.status(400).json({ mensaje: `No hay suficiente stock de ${productoExistente.nombre}. Solo quedan ${productoExistente.stock} unidades para añadir.`});
        }


        if (cantidad <= 0) {
            // Si la cantidad es 0 o menos, eliminar el producto del carrito
            carrito.items.splice(itemIndex, 1);
        } else {
            // Actualizar la cantidad
            carrito.items[itemIndex].cantidad = cantidad;
        }

        await carrito.save();
        res.status(200).json({ mensaje: 'Cantidad de producto actualizada exitosamente.', carrito });

    } catch (error) {
        console.error("Error al actualizar la cantidad del producto en el carrito:", error);
        res.status(500).json ({ mensaje: 'Error al actualizar la cantidad del producto en el carrito.', error: error.message});
    }
};

// 4. Eliminar un producto específico del carrito
const eliminarProductoDelCarrito = async (req, res) => {
    const userId = req.usuario.id;
    const { productoId } = req.params;
    
    try {
        let carrito = await Carrito.findOne ({ usuario: userId });

        if (!carrito) {
            return res.status(404).json ({ mensaje: 'Carrito no encontrado para este usuario.' });
        }

        const initialLength = carrito.items.length;
        carrito.items = carrito.items.filter(item => item.productoId.toString() !== productoId);

        if (carrito.items.length === initialLength){
            return res.status(404).json({ mensaje: 'Producto no encontrado en el carrito.' });
        }

        await carrito.save();
        res.status(200).json({ mensaje:'Producto eliminado del carrito exitosamente.', carrito});
    } catch (error) {
        console.error("Error al eliminar producto del carrito:", error);
        res.status(500).json({ mensaje:'Error al eliminar producto del carrito.', error: error.message});
    }
};

// 5. Vaciar completamente el carrito
const vaciarCarrito = async (req, res) => {
    const userId = req.usuario.id;

    try{
        let carrito = await Carrito.findOne ({ usuario: userId});

        if(!carrito) {
            return res.status(404).json({ mensaje: 'Carrito no encontrado para este usuario.' });
        }

        carrito.items = []; // Vacía el array de productos
        await carrito.save();
        res.status(200).json({ mensaje:'Carrito vaciado exitosamente.', carrito});
    } catch (error) {
        console.error("Error al vaciar el carrito:", error);
        res.status(500).json ({mensaje:'Error al vaciar el carrito.', error: error.message});
    }
};

// 6. Realizar la compra (disminuir stock de productos y vaciar carrito)
const realizarCompra = async (req, res) => {
    const userId = req.usuario.id;

    try {
        let carrito = await Carrito.findOne({ usuario: userId });
        if (!carrito || carrito.items.length === 0) {
            return res.status(400).json({ mensaje: 'El carrito está vacío. No se puede realizar la compra.' });
        }

        
        
        for (const item of carrito.items) {
            const producto = await Producto.findById(item.productoId);

            if (!producto) {
                // Si el producto no existe en el catálogo, es un error crítico para la compra
                return res.status(404).json({ mensaje: `Producto ${item.nombre} no encontrado en el inventario. La compra no se puede completar.` });
            }

            if (producto.stock < item.cantidad) {
                return res.status(400).json({ mensaje: `Stock insuficiente para el producto: ${item.nombre}. Stock disponible: ${producto.stock}. La compra no se puede completar.` });
            }


            // Disminuir el stock del producto real
            console.log(`Stock ANTES de compra: ${producto.stock}`);
            producto.stock -= item.cantidad;
            await producto.save();
            console.log(`Stock DESPUÉS: ${producto.stock}`);
        }

        // Vaciar el carrito después de una compra exitosa
        carrito.items = [];
        await carrito.save();

        res.status(200).json({ mensaje: 'Compra realizada exitosamente. Stock actualizado y carrito vaciado.' });

    } catch (error) {
        console.error("Error al realizar la compra:", error);
        res.status(500).json({ mensaje: 'Error interno del servidor al realizar la compra.', error: error.message});
    }
};


module.exports = {
    obtenerOCrearCarrito,
    agregarProductoAlCarrito,
    actualizarCantidadProducto,
    eliminarProductoDelCarrito,
    vaciarCarrito,
    realizarCompra 
};