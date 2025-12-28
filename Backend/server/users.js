const bodyParser = require("body-parser");
const express = require("express");
const Users = require("../data/users");
const scopes = require("../data/users/scopes");
const VerifyToken = require("../middleware/token");
const cookieParser = require("cookie-parser");
const User = require("../data/users/users");

const UsersRouter = (io) => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.use(cookieParser());
  router.use(VerifyToken);

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users (Admin only)
   *     description: Get a paginated list of all users. Requires admin authentication.
   *     tags: [Users]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of users to return
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of users to skip
   *     responses:
   *       200:
   *         description: List of users
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 auth:
   *                   type: boolean
   *                   example: true
   *                 users:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *                 pagination:
   *                   type: object
   *       401:
   *         description: Unauthorized - Admin access required
   */
  router
  .route("/")
  .get(Users.autorize([scopes.Admin]), function (req, res, next) {
    console.log("get all users");

    const pageLimit = req.query.limit ? parseInt(req.query.limit) : 10;
    const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;

    req.pagination = {
      limit: pageLimit,
      skip: pageSkip,
    };

    Users.findAll(req.pagination)
      .then((users) => {
        const response = {
          auth: true,
          users: users,
          pagination: {
            pageSize: pageLimit,
            total: users.length,
          },
        };
        res.send(response);
        next();
      })
      .catch((err) => {
        console.log(err.message);
        res.status(500).send({ error: err.message });
        next();
      });
  })
  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create a new user (Admin only)
   *     description: Create a new user with scope Client or PersonalTrainer. Only Admin can create users via this endpoint. Requires admin authentication.
   *     tags: [Users]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, password, address, country, taxNumber, role]
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               address:
   *                 type: string
   *               country:
   *                 type: string
   *               taxNumber:
   *                 type: number
   *               age:
   *                 type: number
   *               role:
   *                 type: object
   *                 properties:
   *                   name:
   *                     type: string
   *                   scope:
   *                     type: string
   *                     enum: ["client", "PersonalTrainer"]
   *           example:
   *             name: "user1"
   *             email: "user1@estadio.com"
   *             password: "password123"
   *             address: "Rua Teste"
   *             country: "Portugal"
   *             taxNumber: 987654321
   *             age: 25
   *             role:
   *               name: "client"
   *               scope: "client"
   *     responses:
   *       200:
   *         description: User created successfully
   *       401:
   *         description: Unauthorized or Invalid scope (only Client or PersonalTrainer allowed)
   */
  .post(Users.autorize([scopes.Admin, scopes.PersonalTrainer]), function (req, res, next) {
    console.log("Create user");
    let body = req.body;
    let { role } = body;
    
    // Get user scopes from token
    const decoded = req.decoded || {};
    const userScopes = Array.isArray(decoded.role?.scope)
      ? decoded.role.scope
      : decoded.role?.scope
      ? [decoded.role.scope]
      : [];
    const isAdmin = userScopes.includes(scopes.Admin);
    const isTrainer = userScopes.includes(scopes.PersonalTrainer) && !isAdmin;

    console.log(role);

    // Validar que o scope é válido (Admin, PersonalTrainer ou Client)
    const validScopes = [scopes.Admin, scopes.PersonalTrainer, scopes.Client];
    const scopeValue = Array.isArray(role.scope) ? role.scope[0] : role.scope;
    
    if (!validScopes.includes(scopeValue)) {
      return res.status(401).send({ auth: false, message: 'Invalid scope. Only Admin, PersonalTrainer or Client are allowed' })
    }
    
    // If trainer (not admin), only allow creating Client users
    if (isTrainer && scopeValue !== scopes.Client) {
      return res.status(403).send({ auth: false, message: 'Trainers can only create users with Client scope' })
    }

    // Criar utilizador
    Users.create(body)
      .then((user) => {
        res.status(200);
        res.send(user);
        next();
      })
      .catch((err) => {
        res.status(404);
        res.send({ error: err.message });
        next();
      });
  });

  router
    .route("/:userId")
    .put(Users.autorize([scopes.Admin]), function (req, res, next) {
      console.log("update user by id");
      let userId = req.params.userId;
      let body = req.body;

      Users.update(userId, body)
        .then((user) => {
          res.status(200);
          res.send(user);
          next();
        })
        .catch((err) => {
          res.status(404);
          next();
        });
    });

  return router;
};

module.exports = UsersRouter;
