const bodyParser = require("body-parser");
const express = require("express");
const Members = require("../data/member");
const Users = require("../data/users");
const scopes = require("../data/users/scopes");
const VerifyToken = require("../middleware/Token");
const cookieParser = require("cookie-parser");
const User = require("../data/users/users");
const path = require("path");
const fs = require("fs-extra");

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
   *     description: Create a new NonMember user. Only NonMember users can be created via this endpoint. Requires admin authentication.
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
   *                     enum: ["notMember"]
   *           example:
   *             name: "user1"
   *             email: "user1@estadio.com"
   *             password: "password123"
   *             address: "Rua Teste"
   *             country: "Portugal"
   *             taxNumber: 987654321
   *             age: 25
   *             role:
   *               name: "user"
   *               scope: "notMember"
   *     responses:
   *       200:
   *         description: User created successfully
   *       401:
   *         description: Unauthorized or Only NonMember users can be created
   */
  .post(Users.autorize([scopes.Admin]), function (req, res, next) {
    console.log("Create user");
    let body = req.body;
    let { role } = body;

    console.log(role);

    if(role.scope !== scopes.NonMember) {
      return res.status(401).send({ auth: false, message: 'Only create NonMembers' })
    }

    // Criar utilizador diretamente - o membro será criado automaticamente pelo middleware
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
      console.log("update a member by id");
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

  router
    .route("/:userId/member")
    .post(Users.autorize([scopes.Admin]), function (req, res, next) {
      let body = req.body;
      let userId = req.params.userId;

      // Processar imagem Base64 se existir
      if (body.base64image && body.base64image.startsWith('data:image/')) {
        try {
          // Extrair informações da string Base64
          const matches = body.base64image.match(/^data:image\/(\w+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            return res.status(400).send({ error: 'Formato de imagem Base64 inválido' });
          }

          const imageType = matches[1]; // png, jpeg, etc.
          const base64Data = matches[2]; // dados base64 sem prefixo

          // Decodificar Base64 para buffer
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Criar diretório de uploads se não existir
          const uploadsDir = path.join(__dirname, '../uploads/members');
          fs.ensureDirSync(uploadsDir);

          // Gerar nome único para o ficheiro
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `member-${uniqueSuffix}.${imageType}`;
          const filepath = path.join(uploadsDir, filename);

          // Salvar ficheiro
          fs.writeFileSync(filepath, imageBuffer);

          // Atualizar body.photo com o caminho relativo para servir via HTTP
          body.photo = `/uploads/members/${filename}`;

          // Remover base64image do body (já foi processado)
          delete body.base64image;

          console.log(`Foto do membro salva: ${filepath}`);
        } catch (err) {
          console.error('Erro ao processar imagem Base64:', err);
          return res.status(500).send({ error: 'Erro ao processar imagem' });
        }
      }

      // Criar membro
      Members.create(body)
        .then((result) => {
          console.log(result)
          return Users.update(userId, { memberId: result.member._id});
        })
        .then((user) => {
          console.log("Created!");
          
          // Emitir notificação Socket.IO quando um membro é criado
          if (io) {
            io.emit('member:created', {
              user: user,
              member: result.member,
              message: `Novo membro criado: ${user.name || 'Sem nome'}`,
              timestamp: new Date().toISOString()
            });
            console.log('Socket.IO notification emitted: member:created');
          }
          
          res.status(200);
          res.send(user);
          next();
        })
        .catch((err) => {
          console.log("Member already exists!");
          console.log(err);
          err.status = err.status || 500;
          res.status(401);
          next();
        });
    })

  router
    .route("/member")
    .get(
      Users.autorize([scopes.Admin, scopes.Member, scopes.NonMember]),
      function (req, res, next) {
        console.log("get all tickets");

        const pageLimit = req.query.limit ? parseInt(req.query.limit) : 5;
        const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;

        req.pagination = {
          limit: pageLimit,
          skip: pageSkip,
        };

        Members.findAll(req.pagination)
          .then((members) => {
            const response = {
              auth: true,
              members: members,
            };
            res.send(response);
            next();
          })
          .catch((err) => {
            console.log(err.message);
            next();
          });
      }
    );

  router
    .route("/member/:memberId")
    .get(
      Users.autorize([scopes.Admin, scopes.Member, scopes.NonMember]),
      function (req, res, next) {
        console.log("get member by id");
        let memberId = req.params.memberId;

        Members.findById(memberId)
          .then((member) => {
            if (!member) {
              return res.status(404).send({ error: "Member not found" });
            }
            res.status(200);
            res.send(member);
            next();
          })
          .catch((err) => {
            console.error("Error finding member:", err);
            res.status(404).send({ error: err.message || "Member not found" });
            next();
          });
      }
    )
    .put(Users.autorize([scopes.Admin]), function (req, res, next) {
      console.log("update a member by id");
      let memberId = req.params.memberId;
      let body = req.body;

      // Usar findUserById para encontrar o utilizador
      Users.findUserById(memberId)
        .then((user) => {
          if (!user) {
            return res.status(404).send({ error: "User not found" });
          }

          // Se o utilizador tem memberId, atualizar o membro
          if (user.memberId) {
            return Members.update(user.memberId, body)
              .then((member) => {
                res.status(200);
                res.send(member);
                next();
              })
              .catch((err) => {
                console.error("Error updating member:", err);
                res.status(500).send({ error: "Error updating member" });
                next();
              });
          } else {
            return res.status(404).send({ error: "User does not have an associated member" });
          }
        })
        .catch((err) => {
          console.error("Error finding user:", err);
          res.status(404).send({ error: "User not found" });
          next();
        });
    });

  router
    .route("/member/tax/:taxNumber")
    .get(
      Users.autorize([scopes.Admin, scopes.Member, scopes.NonMember]),
      function (req, res, next) {
        console.log("get the member by tax");

        let taxNumber = req.params.taxNumber;

        Members.findMemberByTaxNumber(taxNumber)
          .then((member) => {
            res.send(member);
            next();
          })
          .catch((err) => {
            console.log(err.message);
            next();
          });
      }
    );

  return router;
};

module.exports = UsersRouter;
