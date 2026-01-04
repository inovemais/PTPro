const Users = require('../data/users');

module.exports = (req, res, next) => {
    // Lista de rotas públicas que não requerem autenticação
    const publicRoutes = [
        '/register',
        '/register/admin',
        '/login',
        '/qr-code/login',
        '/debug/users'
    ];
    
    // Verificar se a rota atual é pública
    const isPublicRoute = publicRoutes.some(route => {
        return req.path === route || req.path.startsWith(route + '/');
    });
    
    if (isPublicRoute) {
        return next();
    }
    
    // Tentar obter token do cookie primeiro
    let token = req.cookies?.token;
    
    // Se não houver token no cookie, tentar obter do header Authorization
    if (!token) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    // Se ainda não houver token, retornar erro
    if (!token) {
      return res.status(401).send({ auth: false, message: 'No token provided.' })
    }

    Users.verifyToken(token)
      .then((decoded) => {
        req.roleUser = decoded.role;
        req.decoded = decoded; // Adicionar decoded completo para acesso ao id
        next();
      })
      .catch((err) => {
        const errorMessage = err && typeof err === 'object' && err.message ? err.message : (err || 'Unknown error');
        console.error('❌ Token verification failed:', errorMessage);
        res.status(401).send({ auth: false, message: 'Not authorized' })
      })
};