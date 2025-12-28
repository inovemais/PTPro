const bodyParser = require("body-parser");
const express = require("express");
const cookieParser = require("cookie-parser");
const VerifyToken = require("../middleware/token");
const scopes = require("../data/users/scopes");
const Users = require("../data/users");
const Clients = require("../data/clients");

const ClientsRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  router.use(cookieParser());
  router.use(VerifyToken);

  // Admin pode ver todos os clientes; trainer vê apenas os seus; cliente vê apenas ele próprio
  router
    .route("/")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer]),
      function (req, res, next) {
        const pageLimit = req.query.limit ? parseInt(req.query.limit) : 10;
        const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;
        const search = req.query.search || "";
        const sort = req.query.sort || "createdAt";

        const pagination = {
          limit: pageLimit,
          skip: pageSkip,
        };

        const decoded = req.decoded || {};
        const scopesFromToken = decoded.role || [];
        const userId = decoded.id;

        const isAdmin = scopesFromToken.includes(scopes.Admin);
        const isTrainer = scopesFromToken.includes(scopes.PersonalTrainer);

        const query = { search, sort };

        if (isTrainer && !isAdmin) {
          // trainer só vê clientes associados a si
          query.trainerId = req.query.trainerId || undefined;
        }

        Clients.ClientService.findAll(query, pagination)
          .then((result) => {
            res.status(200).send({
              auth: true,
              clients: result.clients,
              pagination: result.pagination,
            });
            next();
          })
          .catch((err) => {
            console.error("Error fetching clients:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .post(Users.autorize([scopes.Admin, scopes.PersonalTrainer]), function (req, res, next) {
      const body = req.body;

      Clients.ClientService.create(body)
        .then((result) => {
          res.status(200).send(result);
          next();
        })
        .catch((err) => {
          console.error("Error creating client:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  // Endpoint para o próprio cliente obter/atualizar o seu perfil
  router
    .route("/me")
    .get(Users.autorize([scopes.Client]), function (req, res, next) {
      const userId = req.decoded && req.decoded.id ? req.decoded.id : null;

      if (!userId) {
        return res.status(401).send({ error: "User ID not found in token" });
      }

      Clients.ClientService.findByUserId(userId)
        .then((client) => {
          if (!client) {
            return res.status(404).send({ error: "Client not found" });
          }
          res.status(200).send(client);
          next();
        })
        .catch((err) => {
          console.error("Error fetching client me:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    })
    .put(Users.autorize([scopes.Client]), function (req, res, next) {
      const userId = req.decoded && req.decoded.id ? req.decoded.id : null;
      const body = req.body;

      if (!userId) {
        return res.status(401).send({ error: "User ID not found in token" });
      }

      Clients.ClientService.findByUserId(userId)
        .then((client) => {
          if (!client) {
            return res.status(404).send({ error: "Client not found" });
          }
          return Clients.ClientService.update(client._id, body);
        })
        .then((updated) => {
          res.status(200).send(updated);
          next();
        })
        .catch((err) => {
          console.error("Error updating client me:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  router
    .route("/:clientId")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer]),
      function (req, res, next) {
        const clientId = req.params.clientId;

        Clients.ClientService.findById(clientId)
          .then((client) => {
            if (!client) {
              return res.status(404).send({ error: "Client not found" });
            }
            res.status(200).send(client);
            next();
          })
          .catch((err) => {
            console.error("Error fetching client:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .put(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer]),
      function (req, res, next) {
        const clientId = req.params.clientId;
        const body = req.body;

        Clients.ClientService.update(clientId, body)
          .then((client) => {
            res.status(200).send(client);
            next();
          })
          .catch((err) => {
            console.error("Error updating client:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .delete(Users.autorize([scopes.Admin]), function (req, res, next) {
      const clientId = req.params.clientId;

      Clients.ClientService.removeById(clientId)
        .then(() => {
          res.status(200).send({ message: "Client removed" });
          next();
        })
        .catch((err) => {
          console.error("Error removing client:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  return router;
};

module.exports = ClientsRouter;


