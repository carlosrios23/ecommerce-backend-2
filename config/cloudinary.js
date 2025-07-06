// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const multer = require('multer'); 
const { CloudinaryStorage } = require('multer-storage-cloudinary');

//Configuracion de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//Configuracion de Multer para Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ecommerce_products', // Carpeta en Cloudinary (asegúrate que exista o se creará)
        format: async (req, file) => {
        
            const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const fileExtension = file.mimetype.split('/')[1]; // ej. 'image/png' -> 'png'
            if (allowedFormats.includes(fileExtension)) {
                return fileExtension;
            }
            return 'png'; // Fallback a 'png' si el formato no es el esperado
        },
        public_id: (req, file) => {
            // Genera un nombre único y limpio para el public_id, sin la extensión
            const timestamp = Date.now();
            // Limpia el nombre original para usarlo en el public_id
            const originalNameWithoutExt = file.originalname.split('.').slice(0, -1).join('.');
            // Reemplaza caracteres no alfanuméricos por guiones para un public_id limpio
            const cleanOriginalName = originalNameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
            return `${cleanOriginalName}-${timestamp}`;
        },
    },
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true); // Aceptar archivo
        } else {
            //  Error personalizado para un mejor mensaje de error
            const err = new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, etc.)');
            err.statusCode = 400; // Define un código de estado para este tipo de error
            cb(err, false); // Rechazar archivo
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB por ejemplo
    }
});

module.exports = upload;