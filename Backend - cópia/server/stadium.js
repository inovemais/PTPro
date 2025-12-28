const bodyParser = require("body-parser");
const express = require("express");
const Stadium = require("../data/stadium");
const Users = require("../data/users");
const scopes = require("../data/users/scopes");
const VerifyToken = require("../middleware/token");
const cookieParser = require("cookie-parser");

const StadiumRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.use(cookieParser());
  router.use(VerifyToken);

  /**
   * @swagger
   * /stadium:
   *   post:
   *     summary: Create a new stadium (Admin only)
   *     description: Create a new stadium with sections and pricing. Requires admin authentication.
   *     tags: [Stadium]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, sectors]
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Estádio do Dragão"
   *               sectors:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     sector:
   *                       type: string
   *                       example: "Sector A"
   *                     price:
   *                       type: number
   *                       example: 30.00
   *                     priceMember:
   *                       type: number
   *                       example: 25.00
   *           example:
   *             name: "Estádio do Dragão"
   *             sectors:
   *               - sector: "Sector A"
   *                 price: 30.00
   *                 priceMember: 25.00
   *               - sector: "Sector B"
   *                 price: 25.00
   *                 priceMember: 20.00
   *     responses:
   *       200:
   *         description: Stadium created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Stadium'
   *       401:
   *         description: Unauthorized - Admin access required
   */
  router
    .route("/")
    .post(Users.autorize([scopes.Admin]), function (req, res, next) {
      let body = req.body;

      Stadium.create(body)
        .then((stadium) => {
          console.log("Created!");
          res.status(200);
          res.send(stadium);
          next();
        })
        .catch((err) => {
          console.log("Stadium already exists!");
          console.log(err.message);
          err.status = err.status || 500;
          res.status(401);
          next();
        });
    })
    /**
     * @swagger
     * /stadium:
     *   get:
     *     summary: Get all stadiums
     *     description: Get a paginated list of all stadiums. Requires authentication.
     *     tags: [Stadium]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Number of stadiums to return
     *       - in: query
     *         name: skip
     *         schema:
     *           type: integer
     *           default: 0
     *         description: Number of stadiums to skip
     *     responses:
     *       200:
     *         description: List of stadiums
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 auth:
     *                   type: boolean
     *                   example: true
     *                 stadiums:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Stadium'
     *                 pagination:
     *                   type: object
     *                   properties:
     *                     pageSize:
     *                       type: integer
     *                     total:
     *                       type: integer
     */
    .get(
      Users.autorize([scopes.Admin, scopes.Member, scopes.NonMember]),
      function (req, res, next) {
        console.log("get all stadiums");

        const pageLimit = req.query.limit ? parseInt(req.query.limit) : 10;
        const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;

        req.pagination = {
          limit: pageLimit,
          skip: pageSkip,
        };

        Stadium.findAll(req.pagination)
          .then((stadiums) => {
            const response = {
              auth: true,
              stadiums: stadiums,
              pagination: {
                pageSize: pageLimit,
                total: stadiums.length,
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
      }
    );

  /**
   * @swagger
   * /stadium/{stadiumId}:
   *   get:
   *     summary: Get a stadium by ID
   *     description: Get details of a specific stadium. Requires authentication.
   *     tags: [Stadium]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: stadiumId
   *         required: true
   *         schema:
   *           type: string
   *         description: Stadium ID
   *     responses:
   *       200:
   *         description: Stadium details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Stadium'
   *       404:
   *         description: Stadium not found
   */
  router
    .route("/:stadiumId")
    .get(function (req, res, next) {
      console.log("get a stadium by id");
      let stadiumId = req.params.stadiumId;
      Stadium.find(stadiumId)
        .then((stadium) => {
          res.status(200);
          res.send(stadium);
          next();
        })
        .catch((err) => {
          res.status(404);
          next();
        });
    })
    /**
     * @swagger
     * /stadium/{stadiumId}:
     *   put:
     *     summary: Update a stadium (Admin only)
     *     description: Update an existing stadium. Requires admin authentication.
     *     tags: [Stadium]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: stadiumId
     *         required: true
     *         schema:
     *           type: string
     *         description: Stadium ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               sectors:
     *                 type: array
     *                 items:
     *                   type: object
     *     responses:
     *       200:
     *         description: Stadium updated successfully
     *       401:
     *         description: Unauthorized - Admin access required
     *       404:
     *         description: Stadium not found
     */
    .put(Users.autorize([scopes.Admin]), function (req, res, next) {
      console.log("update a stadium by id");
      let stadiumId = req.params.stadiumId;
      let body = req.body;

      Stadium.update(stadiumId, body)
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

module.exports = StadiumRouter;
