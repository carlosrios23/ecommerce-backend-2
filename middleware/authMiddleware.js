const jwt = require ('jsonwebtoken');

//Recuperar la clave secreta de las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;

const protegerRuta = (req, res, next ) => {
    //Obtener el token del header de la solicitud
    const token = req.header('Authorization');

    //Verificar si hay algun token
    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado.No se proporciono token'});
    }

    try{
        //Extraer token 
        const tokenSinBearer = token.replace('Bearer ', '');

        //Verificar el token existente
        const verificado = jwt.verify(tokenSinBearer, JWT_SECRET);
        
        //Adjuntar informacion del usuario al objeto de la solicitud (req.usuario)

        req.usuario = verificado;
        next(); // 
    } catch (error){
        //Si el token expiro o esta mal conformado
        res.status(401).json({ mensaje: 'Token no valido o expirado'});

    }
};

//Middleware para verificar si el usuario tiene un rol de 'Admin'
const protegerRutaAdmin = (req, res, next) => {
    if (!req.usuario || req.usuario.role !== 'admin') {
        return res.status(403).json({ mensaje: ' Acceso denegado. Se requiere role de administrador'});
    };
    next(); //Continuara de ser admin
};

module.exports = {
    protegerRuta,
    protegerRutaAdmin
};

