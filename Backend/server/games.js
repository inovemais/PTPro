const bodyParser = require("body-parser");
const express = require("express");
const Games = require("../data/games");
const Users = require("../data/users");
const scopes = require("../data/users/scopes");
const VerifyToken = require("../middleware/Token");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs-extra");

const GamesRouter = (io) => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  /**
   * @swagger
   * /games/public:
   *   get:
   *     summary: Get all games (public)
   *     description: Get a paginated list of all games. This endpoint is public and does not require authentication.
   *     tags: [Games]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of games to return
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of games to skip
   *     responses:
   *       200:
   *         description: List of games
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 auth:
   *                   type: boolean
   *                   example: false
   *                 games:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Game'
   *             example:
   *               auth: false
   *               games:
   *                 - _id: "507f1f77bcf86cd799439011"
   *                   name: "FC Porto vs Benfica"
   *                   date: "2024-12-25T20:00:00.000Z"
   *                   stadiumId: "507f1f77bcf86cd799439012"
   *                   image: "/uploads/games/game-1234567890.png"
   *       500:
   *         description: Server error
   */
  // Rota pública para ver jogos (sem autenticação)
  router.route("/public").get(function (req, res, next) {
    console.log("get all games (public)");

    const pageLimit = req.query.limit ? parseInt(req.query.limit) : 10;
    const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;

    const pagination = {
      limit: pageLimit,
      skip: pageSkip,
    };

    Games.findAll(pagination)
      .then((games) => {
        const response = {
          auth: false, // Público
          ...games
        };
        res.send(response);
        next();
      })
      .catch((err) => {
        console.log(err.message);
        res.status(500).send({ error: err.message });
        next();
      });
  });

  /**
   * @swagger
   * /games/public/{gamesId}:
   *   get:
   *     summary: Get a game by ID (public)
   *     description: Get details of a specific game. This endpoint is public and does not require authentication.
   *     tags: [Games]
   *     parameters:
   *       - in: path
   *         name: gamesId
   *         required: true
   *         schema:
   *           type: string
   *         description: Game ID
   *     responses:
   *       200:
   *         description: Game details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 auth:
   *                   type: boolean
   *                   example: false
   *                 game:
   *                   $ref: '#/components/schemas/Game'
   *       404:
   *         description: Game not found
   */
  // Rota pública para ver um jogo específico
  router.route("/public/:gamesId").get(function (req, res, next) {
    console.log("get game by id (public)");
    let gamesId = req.params.gamesId;
    Games.find(gamesId)
      .then((game) => {
        if (!game) {
          return res.status(404).send({ error: "Game not found" });
        }
        res.status(200).send({
          auth: false,
          game: game
        });
        next();
      })
      .catch((err) => {
        res.status(404).send({ error: "Game not found" });
        next();
      });
  });

  router.use(cookieParser());
  router.use(VerifyToken);

  /**
   * @swagger
   * /games:
   *   post:
   *     summary: Create a new game (Admin only)
   *     description: Create a new game. Requires admin authentication. Image can be sent as base64 string.
   *     tags: [Games]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, date, stadiumId]
   *             properties:
   *               name:
   *                 type: string
   *                 example: "FC Porto vs Benfica"
   *               date:
   *                 type: string
   *                 format: date-time
   *                 example: "2024-12-25T20:00:00.000Z"
   *               stadiumId:
   *                 type: string
   *                 example: "507f1f77bcf86cd799439012"
   *               image:
   *                 type: string
   *                 description: Base64 encoded image (optional)
   *                 example: "data:image/png;base64,iVBORw0KGgo..."
   *     responses:
   *       200:
   *         description: Game created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Game'
   *       401:
   *         description: Unauthorized - Admin access required
   *       500:
   *         description: Server error
   */
  router
    .route("/")
    .post(Users.autorize([scopes.Admin]), function (req, res, next) {
      let body = req.body;

      // Processar imagem Base64 se existir
      if (body.image && body.image.startsWith('data:image/')) {
        try {
          // Extrair informações da string Base64
          const matches = body.image.match(/^data:image\/(\w+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            return res.status(400).send({ error: 'Formato de imagem Base64 inválido' });
          }

          const imageType = matches[1]; // png, jpeg, etc.
          const base64Data = matches[2]; // dados base64 sem prefixo

          // Decodificar Base64 para buffer
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Criar diretório de uploads se não existir
          const uploadsDir = path.join(__dirname, '../uploads/games');
          fs.ensureDirSync(uploadsDir);

          // Gerar nome único para o ficheiro
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `game-${uniqueSuffix}.${imageType}`;
          const filepath = path.join(uploadsDir, filename);

          // Salvar ficheiro
          fs.writeFileSync(filepath, imageBuffer);

          // Atualizar body.image com o caminho relativo para servir via HTTP
          body.image = `/uploads/games/${filename}`;

          console.log(`Imagem salva: ${filepath}`);
        } catch (err) {
          console.error('Erro ao processar imagem Base64:', err);
          return res.status(500).send({ error: 'Erro ao processar imagem' });
        }
      }

      Games.create(body)
        .then((result) => {
          console.log("Created!");
          
          // Emitir notificação Socket.IO quando um game é criado
          if (io) {
            io.emit('game:created', {
              game: result,
              message: `Novo jogo criado: ${result.name || 'Sem nome'}`,
              timestamp: new Date().toISOString()
            });
            console.log('Socket.IO notification emitted: game:created');
          }
          
          res.status(200);
          res.send(result);
          next();
        })
        .catch((err) => {
          console.log("Game already exists!");
          console.log(err.message);
          err.status = err.status || 500;
          res.status(401);
          next();
        });
    })
    /**
     * @swagger
     * /games:
     *   get:
     *     summary: Get all games (Authenticated)
     *     description: Get a paginated list of all games. Requires authentication (Admin, Member, or NonMember).
     *     tags: [Games]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 5
     *         description: Number of games to return
     *       - in: query
     *         name: skip
     *         schema:
     *           type: integer
     *           default: 0
     *         description: Number of games to skip
     *     responses:
     *       200:
     *         description: List of games
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 auth:
     *                   type: boolean
     *                   example: true
     *                 games:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Game'
     *       401:
     *         description: Unauthorized
     */
    .get(
      Users.autorize([scopes.Admin, scopes.Member, scopes.NonMember]),
      function (req, res, next) {
        console.log("get all games");

        const pageLimit = req.query.limit ? parseInt(req.query.limit) : 5;
        const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;

        req.pagination = {
          limit: pageLimit,
          skip: pageSkip,
        };

        Games.findAll(req.pagination)
          .then((games) => {
            const response = {
              auth: true,
              ...games
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

  /**
   * @swagger
   * /games/{gamesId}:
   *   get:
   *     summary: Get a game by ID
   *     description: Get details of a specific game. Requires authentication.
   *     tags: [Games]
   *     security:
   *       - cookieAuth: []
     *     parameters:
   *       - in: path
   *         name: gamesId
   *         required: true
   *         schema:
   *           type: string
   *         description: Game ID
   *     responses:
   *       200:
   *         description: Game details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Game'
   *       404:
   *         description: Game not found
   */
  router
    .route("/:gamesId")
    .get(function (req, res, next) {
      console.log("get a game by id");
      let gamesId = req.params.gamesId;
      Games.find(gamesId)
        .then((game) => {
          res.status(200);
          res.send(game);
          next();
        })
        .catch((err) => {
          res.status(404);
          next();
        });
    })
    /**
     * @swagger
     * /games/{gamesId}:
     *   put:
     *     summary: Update a game (Admin only)
     *     description: Update an existing game. Requires admin authentication.
     *     tags: [Games]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: gamesId
     *         required: true
     *         schema:
     *           type: string
     *         description: Game ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               date:
     *                 type: string
     *                 format: date-time
     *               stadiumId:
     *                 type: string
     *               image:
     *                 type: string
     *                 description: Base64 encoded image (optional)
     *     responses:
     *       200:
     *         description: Game updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Game'
     *       401:
     *         description: Unauthorized - Admin access required
     *       404:
     *         description: Game not found
     */
    .put(Users.autorize([scopes.Admin]), function (req, res, next) {
      console.log("update a game by id");
      let gamesId = req.params.gamesId;
      let body = req.body;

      // Processar imagem Base64 se existir e for uma nova imagem
      if (body.image && body.image.startsWith('data:image/')) {
        try {
          // Extrair informações da string Base64
          const matches = body.image.match(/^data:image\/(\w+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            return res.status(400).send({ error: 'Formato de imagem Base64 inválido' });
          }

          const imageType = matches[1]; // png, jpeg, etc.
          const base64Data = matches[2]; // dados base64 sem prefixo

          // Decodificar Base64 para buffer
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Criar diretório de uploads se não existir
          const uploadsDir = path.join(__dirname, '../uploads/games');
          fs.ensureDirSync(uploadsDir);

          // Gerar nome único para o ficheiro
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `game-${uniqueSuffix}.${imageType}`;
          const filepath = path.join(uploadsDir, filename);

          // Salvar ficheiro
          fs.writeFileSync(filepath, imageBuffer);

          // Atualizar body.image com o caminho relativo para servir via HTTP
          body.image = `/uploads/games/${filename}`;

          console.log(`Imagem atualizada e salva: ${filepath}`);
        } catch (err) {
          console.error('Erro ao processar imagem Base64:', err);
          return res.status(500).send({ error: 'Erro ao processar imagem' });
        }
      }

      Games.update(gamesId, body)
        .then((player) => {
          res.status(200);
          res.send(player);
          next();
        })
        .catch((err) => {
          res.status(404);
          next();
        });
    });

  return router;
};

module.exports = GamesRouter;
