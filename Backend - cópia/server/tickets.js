const bodyParser = require("body-parser");
const express = require("express");
const Tickets = require("../data/tickets");
const Users = require("../data/users");
const Games = require("../data/games");
const Stadium = require("../data/stadium");
const scopes = require("../data/users/scopes");
const VerifyToken = require("../middleware/token");
const cookieParser = require("cookie-parser");

const TicketsRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.use(cookieParser());
  router.use(VerifyToken);

  /**
   * @swagger
   * /tickets/purchase:
   *   post:
   *     summary: Purchase a ticket
   *     description: Purchase a ticket for a game. Price is automatically calculated based on user membership status. Requires Member or NonMember authentication.
   *     tags: [Tickets]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [gameId, sector]
   *             properties:
   *               gameId:
   *                 type: string
   *                 description: Game ID
   *                 example: "507f1f77bcf86cd799439011"
   *               sector:
   *                 type: string
   *                 description: Stadium sector
   *                 example: "Sector A"
   *           example:
   *             gameId: "507f1f77bcf86cd799439011"
   *             sector: "Sector A"
   *     responses:
   *       200:
   *         description: Ticket purchased successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Ticket purchased successfully"
   *                 ticket:
   *                   $ref: '#/components/schemas/Ticket'
   *                 price:
   *                   type: number
   *                   example: 25.50
   *                 isMember:
   *                   type: boolean
   *                   example: true
   *       400:
   *         description: Bad request - gameId and sector are required
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  // Endpoint para utilizadores comprarem tickets (Member ou NonMember)
  router
    .route("/purchase")
    .post(Users.autorize([scopes.Member, scopes.NonMember]), function (req, res, next) {
      const body = req.body;
      const { gameId, sector } = body;
      // O VerifyToken adiciona decoded ao req, vamos buscar o id do token
      const userId = req.decoded && req.decoded.id ? req.decoded.id : null;

      if (!userId) {
        return res.status(401).send({ error: "User ID not found in token" });
      }

      if (!gameId || !sector) {
        return res.status(400).send({ error: "gameId and sector are required" });
      }

      // 1. Buscar o Game
      Games.find(gameId)
        .then((game) => {
          if (!game) {
            throw new Error("Game not found");
          }

          // 2. Buscar o Stadium através do game.stadiumId
          // O populate pode retornar objeto ou string ID
          let stadiumId = null;
          if (game.stadiumId) {
            if (typeof game.stadiumId === 'object' && game.stadiumId._id) {
              stadiumId = game.stadiumId._id;
            } else if (typeof game.stadiumId === 'string') {
              stadiumId = game.stadiumId;
            } else {
              stadiumId = game.stadiumId.toString();
            }
          }
          
          if (!stadiumId) {
            throw new Error("Game does not have a stadium associated");
          }

          return Stadium.find(stadiumId)
            .then((stadium) => {
              if (!stadium) {
                throw new Error("Stadium not found for this game");
              }

              // 3. Buscar o utilizador para verificar se é sócio
              return Users.findUserById(userId)
                .then((user) => {
                  if (!user) {
                    throw new Error("User not found");
                  }

                  // 4. Verificar se o utilizador é sócio
                  const isMember = user.role && 
                    user.role.scope && 
                    Array.isArray(user.role.scope) && 
                    user.role.scope.includes(scopes.Member);

                  // 5. Encontrar o setor no Stadium
                  const stadiumSector = stadium.sectors.find((s) => 
                    s.sector && s.sector.includes(sector)
                  );

                  if (!stadiumSector) {
                    throw new Error(`Sector "${sector}" not found in this stadium`);
                  }

                  // 6. Aplicar preço correto
                  const price = isMember ? stadiumSector.priceMember : stadiumSector.price;

                  // 7. Criar o ticket
                  const ticketData = {
                    sector: sector,
                    price: price,
                    gameId: gameId,
                    userId: userId,
                    isMember: isMember, // Guardar para histórico
                  };

                  return Tickets.create(ticketData)
                    .then((result) => {
                      // 8. Atualizar o utilizador adicionando o ticket
                      return Users.update(userId, {
                        $push: { tickets: result.ticket._id }
                      })
                        .then((updatedUser) => {
                          res.status(200).send({
                            message: "Ticket purchased successfully",
                            ticket: result.ticket,
                            price: price,
                            isMember: isMember,
                          });
                          next();
                        });
                    });
                });
            });
        })
        .catch((err) => {
          console.error("Error purchasing ticket:", err);
          res.status(500).send({ error: err.message || "Error purchasing ticket" });
          next();
        });
    });

  // Endpoint antigo para Admin criar tickets manualmente (mantido para compatibilidade)
  router
    .route("/user")
    .post(Users.autorize([scopes.Admin]), function (req, res, next) {
      let body = req.body;

      Tickets.create(body)
        .then((result) => {
          console.log('ticket', result.ticket.userId);
          return Users.update(result.ticket.userId, {
            tickets: [result.ticket._id],
          });
        })
        .then((ticket) => {
          console.log("Created!");
          res.status(200);
          res.send(ticket);
          next();
        })
        .catch((err) => {
          console.log(err);
          console.log("Ticket already exists!");
          console.log(err.message);
          err.status = err.status || 500;
          res.status(401);
          next();
        });
    });

  /**
   * @swagger
   * /tickets:
   *   get:
   *     summary: Get all tickets
   *     description: Get a paginated list of all tickets. Requires authentication.
   *     tags: [Tickets]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 5
   *         description: Number of tickets to return
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of tickets to skip
   *     responses:
   *       200:
   *         description: List of tickets
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 auth:
   *                   type: boolean
   *                   example: true
   *                 tickets:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Ticket'
   */
  router
    .route("/")
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

        // Obter userId do token decodificado
        const userId = req.decoded && req.decoded.id ? req.decoded.id : null;
        
        // Verificar se o usuário é admin
        const isAdmin = req.decoded && req.decoded.role && 
          req.decoded.role.scope && 
          Array.isArray(req.decoded.role.scope) && 
          req.decoded.role.scope.includes(scopes.Admin);

        // Se for admin, retorna todos os tickets
        // Se não for admin, retorna apenas os tickets do usuário
        // Converter userId para string para garantir compatibilidade com o modelo
        const ticketsPromise = isAdmin 
          ? Tickets.findAll(req.pagination)
          : userId 
            ? Tickets.findTicketsByUserId(userId.toString(), req.pagination)
            : Promise.resolve([]);

        ticketsPromise
          .then((tickets) => {
            const response = {
              auth: true,
              tickets: tickets || [],
            };
            res.send(response);
            next();
          })
          .catch((err) => {
            console.log(err.message);
            res.status(500).send({ error: err.message || "Error fetching tickets" });
            next();
          });
      }
    );

  /**
   * @swagger
   * /tickets/{ticketId}:
   *   get:
   *     summary: Get a ticket by ID
   *     description: Get details of a specific ticket. Requires authentication.
   *     tags: [Tickets]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: ticketId
   *         required: true
   *         schema:
   *           type: string
   *         description: Ticket ID
   *     responses:
   *       200:
   *         description: Ticket details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Ticket'
   *       404:
   *         description: Ticket not found
   */
  router
    .route("/:ticketId")
    .get(function (req, res, next) {
      console.log("get a ticket by id");
      let ticketId = req.params.ticketId;
      Tickets.find(ticketId)
        .then((ticket) => {
          res.status(200);
          res.send(ticket);
          next();
        })
        .catch((err) => {
          res.status(404);
          next();
        });
    })
    /**
     * @swagger
     * /tickets/{ticketId}:
     *   put:
     *     summary: Update a ticket (Admin only)
     *     description: Update an existing ticket. Requires admin authentication.
     *     tags: [Tickets]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: ticketId
     *         required: true
     *         schema:
     *           type: string
     *         description: Ticket ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               sector:
     *                 type: string
     *               price:
     *                 type: number
     *               gameId:
     *                 type: string
     *               userId:
     *                 type: string
     *               isMember:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Ticket updated successfully
     *       401:
     *         description: Unauthorized - Admin access required
     *       404:
     *         description: Ticket not found
     */
    .put(Users.autorize([scopes.Admin]), function (req, res, next) {
      console.log("update a ticket by id");
      let ticketId = req.params.ticketId;
      let body = req.body;

      Tickets.update(ticketId, body)
        .then((ticket) => {
          res.status(200);
          res.send(ticket);
          next();
        })
        .catch((err) => {
          res.status(404);
          next();
        });
    });

  router.route("/game/:gameId").get(function (req, res, next) {
    console.log("get a game by id");
    let gameId = req.params.gameId;
    Tickets.findTicketsByGame(gameId)
      .then((game) => {
        res.status(200);
        res.send(game);
        next();
      })
      .catch((err) => {
        res.status(404);
        next();
      });
  });

  return router;
};

module.exports = TicketsRouter;
