const Users = require('../data/users');

module.exports = (req, res, next) => {
    // Tentar obter token do cookie primeiro
    let token = req.cookies.token;
    
    // Se não houver token no cookie, tentar obter do header Authorization
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('🔐 Token found in Authorization header');
      }
    } else {
      console.log('🔐 Token found in cookie');
    }
    
    // Se ainda não houver token, retornar erro
    if (!token) {
      console.log('❌ No token provided in cookie or Authorization header');
      return res.status(401).send({ auth: false, message: 'No token provided.' })
    }

    console.log('🔐 Verifying token...');
    Users.verifyToken(token)
      .then((decoded) => {
        console.log('✅ Token verified successfully for user:', decoded.id);
        req.roleUser = decoded.role;
        req.decoded = decoded; // Adicionar decoded completo para acesso ao id
        next();
      })
      .catch((err) => {
        console.error('❌ Token verification failed:', err.message || err);
        res.status(401).send({ auth: false, message: 'Not authorized' })
      })
};