const express = require('express');
const router = express.Router();
const productosController = require ('../controllers/productosController') //Controladores importados
const {protegerRuta, protegerRutaAdmin } = require ('../middleware/authMiddleware');

module.exports = (upload) => {

//Ruta para obtener todos los productos
router.get('/', productosController.obtenerProductos);

//Ruta para obtener un producto por ID
router.get('/:id', productosController.obtenerProductoPorId);

//Ruta para crear un nuevo producto
router.post('/', protegerRuta, protegerRutaAdmin, upload.single('imagen'), productosController.crearProducto);

//Ruta para actualizar un producto por su ID
router.put('/:id',protegerRuta, protegerRutaAdmin, upload.single('imagen'), productosController.actualizarProducto);

//Ruta para eliminar un producto por su ID
router.delete('/:id', protegerRuta, protegerRutaAdmin, productosController.eliminarProducto);
return router;
}
