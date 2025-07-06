// ecommerce-backend-2/routes/carrito.js

const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');
const { protegerRuta } = require ('../middleware/authMiddleware'); // Asegúrate de que protegerRuta esté importado

// GET /api/carrito
// Obtener el carrito de un usuario (o crear uno si no existe)
router.get('/', protegerRuta, carritoController.obtenerOCrearCarrito);

// POST /api/carrito/items
// Agregar producto al carrito
router.post('/items', protegerRuta, carritoController.agregarProductoAlCarrito);

// PUT /api/carrito/items/:productoId
// Actualizar la cantidad de un producto en el carrito
router.put('/items/:productoId', protegerRuta, carritoController.actualizarCantidadProducto);

// DELETE /api/carrito/items/:productoId
// Eliminar un producto del carrito
router.delete('/items/:productoId', protegerRuta, carritoController.eliminarProductoDelCarrito);

// POST /api/carrito/comprar
// Realizar la compra (disminuir stock y vaciar carrito)
router.post('/comprar', protegerRuta, carritoController.realizarCompra); // ¡Nueva ruta!

// DELETE /api/carrito/vaciar
// Vaciar en totalidad el carrito
router.delete ('/vaciar', protegerRuta, carritoController.vaciarCarrito);

module.exports = router;