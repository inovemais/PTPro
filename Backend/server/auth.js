const bodyParser = require("body-parser");
const express = require("express");
const Users = require("../data/users");
const Members = require("../data/member");
const cookieParser = require('cookie-parser');
const VerifyToken = require('../middleware/token');
const QRCode = require('qrcode');



function AuthRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  router.use(cookieParser());

  // ========== ROTAS PÚBLICAS (sem autenticação) ==========
  
  // Endpoint público para login via QR code
  router.route("/qr-code/login").post(function (req, res, next) {
    const { qrCodeData } = req.body;

    if (!qrCodeData) {
      return res.status(400).send({ error: 'QR code data is required' });
    }

    try {
      // Parse QR code data
      const qrData = JSON.parse(qrCodeData);
      
      if (qrData.type !== 'login' || !qrData.userId) {
        return res.status(400).send({ error: 'Invalid QR code format' });
      }

      // Verificar se o QR code não é muito antigo (opcional: máximo 30 dias)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
      if (qrData.timestamp && (Date.now() - qrData.timestamp) > maxAge) {
        return res.status(410).send({ error: 'QR code expired' });
      }

      // Buscar utilizador pelo userId do QR code
      Users.findUserById(qrData.userId)
        .then((user) => {
          if (!user) {
            throw new Error('User not found');
          }

          // Criar token JWT para o utilizador
          return Users.createToken(user);
        })
        .then((tokenResponse) => {
          // The httpOnly: true setting means that the cookie can't be read using JavaScript
          const isProduction = process.env.NODE_ENV === 'production';
          const isSecure = isProduction || process.env.FORCE_SECURE_COOKIE === 'true';
          
          res.cookie("token", tokenResponse.token, { 
            httpOnly: true,
            sameSite: isSecure ? 'none' : 'lax',
            secure: isSecure,
            maxAge: 86400000 // 24 horas
          });
          
          console.log(`🍪 QR Code login cookie set: secure=${isSecure}, sameSite=${isSecure ? 'none' : 'lax'}`);
          res.status(200).send({
            success: true,
            auth: true,
            message: 'Login successful via QR code',
            token: tokenResponse.token
          });
        })
        .catch((err) => {
          console.error('Error validating QR code login:', err);
          res.status(401).send({ error: 'Invalid QR code or user not found' });
        });
    } catch (err) {
      console.error('Error parsing QR code:', err);
      res.status(400).send({ error: 'Invalid QR code format' });
    }
  });

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new admin user
   *     description: Creates a new admin user. The role.scope must include 'admin'. A member will be automatically created and associated with the user.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *           example:
   *             name: "adminuser"
   *             email: "admin@estadio.com"
   *             password: "password123"
   *             address: "Rua lá de casa"
   *             country: "Portugal"
   *             taxNumber: 123456789
   *             age: 30
   *             role:
   *               name: "admin"
   *               scope: ["admin"]
   *     responses:
   *       200:
   *         description: Admin user created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RegisterResponse'
   *             example:
   *               message: "User saved"
   *               auth: true
   *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *               user:
   *                 _id: "507f1f77bcf86cd799439011"
   *                 name: "admin"
   *                 email: "admin@estadio.com"
   *       401:
   *         description: Only admin users can be created via this endpoint
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 auth:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Only create Admin"
   *       500:
   *         description: Server error (e.g., duplicate email, name, or taxNumber)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Endpoint público para registro (criação de admin)
  router.route("/register").post(function (req, res, next) {
    const body = req.body;
    
    const { role } = body;

    // Accept either a string or array for scope; must contain 'admin'
    const scopes = Array.isArray(role && role.scope) ? role.scope : [role && role.scope];
    if(!scopes.includes('admin')) {
      return res.status(401).send({ auth: false, message: 'Only create Admin' })
    }

    // Criar admin diretamente - o membro será criado automaticamente pelo middleware
    Users.create(body)
      .then((saved) => Users.createToken(saved.user))
      .then((response) => {
        res.status(200);
        res.send(response);
      })
      .catch((err) => {
        res.status(500);
        res.send(err);
        next();
      });
  });

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: User login
   *     description: Authenticate user with username and password. Returns JWT token and QR code for future logins.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *           example:
   *             name: "administrador"
   *             password: "password123"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *             example:
   *               auth: true
   *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *               qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               auth: false
   *               message: "Credenciais inválidas"
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Endpoint público para login
  router.route("/login").post(function (req, res, next) {
    let body = req.body;

    return Users.findUser(body)
      .then((user) => {
        return Users.createToken(user);
      })
      .then(async (response) => {
        // The httpOnly: true setting means that the cookie can't be read using JavaScript but can still be sent back to the server in HTTP requests
        const isProduction = process.env.NODE_ENV === 'production';
        const isSecure = isProduction || process.env.FORCE_SECURE_COOKIE === 'true';
        
        res.cookie("token", response.token, { 
          httpOnly: true,
          sameSite: isSecure ? 'none' : 'lax', // 'none' requer secure: true
          secure: isSecure, // true em produção (HTTPS), false em desenvolvimento
          maxAge: 86400000 // 24 horas
        });
        
        console.log(`🍪 Cookie set: secure=${isSecure}, sameSite=${isSecure ? 'none' : 'lax'}`);
        
        // Gerar QR code para login futuro
        const userId = response.decoded?.id || response.user?._id?.toString();
        if (userId) {
          try {
            const qrCodeData = JSON.stringify({
              type: 'login',
              userId: userId,
              timestamp: Date.now()
            });

            const qrCodeImage = await QRCode.toDataURL(qrCodeData, { 
              errorCorrectionLevel: 'M',
              type: 'image/png',
              width: 300
            });

            res.status(200);
            res.send({
              ...response,
              qrCode: qrCodeImage
            });
          } catch (qrErr) {
            console.error('Error generating QR code:', qrErr);
            // Se falhar ao gerar QR code, ainda retorna login bem-sucedido
            res.status(200);
            res.send(response);
          }
        } else {
          res.status(200);
          res.send(response);
        }
      })
      .catch((err) => {
        console.log('Login error:', err);
        // Retornar 401 para credenciais inválidas
        const errorMessage = err === "This data is wrong" || err === "User not valid" 
          ? "Credenciais inválidas" 
          : (typeof err === 'string' ? err : 'Erro no login');
        
        res.status(401);
        res.send({ 
          auth: false, 
          message: errorMessage 
        });
      });
  });

  // ========== ROTAS PROTEGIDAS (requerem autenticação) ==========
  router.use(VerifyToken);
  
  // Endpoint para obter QR code do utilizador logado
  router.route("/qr-code").get(function (req, res, next) {
    const userId = req.decoded && req.decoded.id ? req.decoded.id : null;

    if (!userId) {
      return res.status(401).send({ error: 'User not authenticated' });
    }

    // Criar dados do QR code com userId (válido enquanto token estiver válido)
    const qrCodeData = JSON.stringify({
      type: 'login',
      userId: userId,
      timestamp: Date.now()
    });

    // Gerar QR code como imagem base64
    QRCode.toDataURL(qrCodeData, { 
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300
    })
      .then((qrCodeImage) => {
        res.status(200).send({
          qrCode: qrCodeImage,
          userId: userId
        });
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        res.status(500).send({ error: 'Failed to generate QR code' });
      });
  });

  router.route("/logout").get(function (req, res, next) {
    // The httpOnly: true setting means that the cookie can’t be read using JavaScript but can still be sent back to the server in HTTP requests
    // MaxAge : It allows us to invalidate the cookie
    res.cookie("token", req.cookies.token, { httpOnly: true, maxAge: 0 });

    res.status(200);
    res.send({ logout: true });
    next();
  });

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current user information
   *     description: Returns information about the currently authenticated user
   *     tags: [Auth]
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: User information retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 auth:
   *                   type: boolean
   *                   example: true
   *                 decoded:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "507f1f77bcf86cd799439011"
   *                     name:
   *                       type: string
   *                       example: "admin"
   *                     role:
   *                       type: object
   *                       properties:
   *                         name:
   *                           type: string
   *                           example: "admin"
   *                         scope:
   *                           type: array
   *                           items:
   *                             type: string
   *                           example: ["admin"]
   *       401:
   *         description: Unauthorized - User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: "User ID not found in token"
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.route("/me").get(function(req, res, next)  {
    try {
      const userId = req.decoded && req.decoded.id ? req.decoded.id : null;
      
      if (!userId) {
        return res.status(401).send({ error: 'User ID not found in token' });
      }

      // Buscar utilizador da base de dados para obter o role atualizado
      Users.findUserById(userId)
        .then((user) => {
          if (!user) {
            return res.status(404).send({ error: 'User not found' });
          }

          // Retornar o role atualizado da base de dados
          const role = user.role || {};
          const scopes = Array.isArray(role.scope) ? role.scope : (role.scope ? [role.scope] : []);
          
          res.status(200).send({ 
            auth: true, 
            decoded: {
              id: user._id.toString(),
              name: user.name,
              role: {
                name: role.name || 'user',
                scope: scopes
              }
            }
          });
          next();
        })
        .catch((err) => {
          console.error('Error fetching user:', err);
          res.status(500).send({ error: err.message || 'Error fetching user' });
          next();
        });
    } catch (err) {
      res.status(500).send({ error: err.message });
      next();
    }
  });

  return router;
}

module.exports = AuthRouter;
