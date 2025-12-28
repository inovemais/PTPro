const Users = require('../data/users');

module.exports = (req, res, next) => {
    console.log('🔐 Token middleware - Request received');
    console.log('🔐 Request method:', req.method);
    console.log('🔐 Request path:', req.path);
    console.log('🔐 Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔐 Request cookies:', JSON.stringify(req.cookies, null, 2));
    
    // Tentar obter token do cookie primeiro
    let token = req.cookies?.token;
    
    if (token) {
      console.log('🔐 Token found in cookie (length:', token.length, ')');
    } else {
      console.log('⚠️  No token in cookie');
    }
    
    // Se não houver token no cookie, tentar obter do header Authorization
    if (!token) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      console.log('🔐 Authorization header:', authHeader ? 'Present' : 'Not present');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('🔐 Token found in Authorization header (length:', token.length, ')');
      } else if (authHeader) {
        console.log('⚠️  Authorization header present but does not start with "Bearer "');
      }
    }
    
    // Se ainda não houver token, retornar erro
    if (!token) {
      console.log('❌ No token provided in cookie or Authorization header');
      console.log('❌ Available headers:', Object.keys(req.headers));
      console.log('❌ Available cookies:', Object.keys(req.cookies || {}));
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