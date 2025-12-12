const Users = require('../data/users');

module.exports = (req, res, next) => {
    console.log(req.cookies)
    let token = req.cookies.token;

    if (!token) {
      return res.status(401).send({ auth: false, message: 'No token provided.' })
    }

    Users.verifyToken(token)
      .then((decoded) => {
        req.roleUser = decoded.role;
        req.decoded = decoded; // Adicionar decoded completo para acesso ao id
        next();
      })
      .catch(() => {
        res.status(401).send({ auth: false, message: 'Not authorized' })
      })
};