const bodyParser = require("body-parser");
const express = require("express");
const cookieParser = require("cookie-parser");
const VerifyToken = require("../middleware/token");
const scopes = require("../data/users/scopes");
const Users = require("../data/users");
const TrainerChangeRequests = require("../data/trainerChangeRequests");
const Clients = require("../data/clients");

const TrainerChangeRequestsRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  router.use(cookieParser());
  router.use(VerifyToken);

  // Cliente cria pedido de mudança de treinador
  router
    .route("/")
    .post(Users.autorize([scopes.Client]), function (req, res, next) {
      const decoded = req.decoded || {};
      const userId = decoded.id;
      const body = req.body;

      Clients.ClientService.findByUserId(userId)
        .then((client) => {
          if (!client) {
            return res.status(404).send({ error: "Client not found" });
          }

          const requestData = {
            clientId: client._id,
            currentTrainerId: client.trainerId,
            requestedTrainerId: body.requestedTrainerId,
            reason: body.reason,
          };

          return TrainerChangeRequests.TrainerChangeRequestService.create(
            requestData
          );
        })
        .then((request) => {
          res.status(200).send(request);
          next();
        })
        .catch((err) => {
          console.error("Error creating trainer change request:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    })
    // Admin lista pedidos
    .get(Users.autorize([scopes.Admin]), function (req, res, next) {
      const pageLimit = req.query.limit ? parseInt(req.query.limit) : 10;
      const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;
      const status = req.query.status;

      const pagination = {
        limit: pageLimit,
        skip: pageSkip,
      };

      TrainerChangeRequests.TrainerChangeRequestService.findAll(
        { status },
        pagination
      )
        .then((result) => {
          res.status(200).send({
            auth: true,
            requests: result.requests,
            pagination: result.pagination,
          });
          next();
        })
        .catch((err) => {
          console.error("Error fetching trainer change requests:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  // Admin aprova/rejeita pedido e atualiza client.trainerId se aprovado
  router
    .route("/:requestId/status")
    .put(Users.autorize([scopes.Admin]), function (req, res, next) {
      const requestId = req.params.requestId;
      const status = req.body.status;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).send({ error: "Invalid status" });
      }

      let updatedRequest;

      TrainerChangeRequests.TrainerChangeRequestService.updateStatus(
        requestId,
        status
      )
        .then((request) => {
          updatedRequest = request;

          if (!request || status !== "approved") {
            return null;
          }

          const clientId = request.clientId && request.clientId._id
            ? request.clientId._id
            : request.clientId;

          return Clients.ClientService.update(clientId, {
            trainerId: request.requestedTrainerId,
          });
        })
        .then(() => {
          res.status(200).send({
            message: "Request status updated",
            request: updatedRequest,
          });
          next();
        })
        .catch((err) => {
          console.error("Error updating trainer change request status:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  return router;
};

module.exports = TrainerChangeRequestsRouter;


