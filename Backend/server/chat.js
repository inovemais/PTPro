const bodyParser = require("body-parser");
const express = require("express");
const cookieParser = require("cookie-parser");
const VerifyToken = require("../middleware/token");
const scopes = require("../data/users/scopes");
const Users = require("../data/users");
const Messages = require("../data/messages");

const ChatRouter = (io) => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  router.use(cookieParser());
  router.use(VerifyToken);

  // Enviar mensagem entre cliente e personal trainer
  router
    .route("/")
    .post(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
      function (req, res, next) {
        const decoded = req.decoded || {};
        const senderId = decoded.id;
        const body = req.body;

        const messageData = {
          senderId,
          receiverId: body.receiverId,
          text: body.text,
        };

        Messages.MessageService.create(messageData)
          .then((message) => {
            // Emitir mensagem via Socket.IO com evento chat:new_message
            if (io) {
              io.to(String(message.receiverId)).emit("chat:new_message", message);
            }

            res.status(200).send(message);
            next();
          })
          .catch((err) => {
            console.error("Error sending message:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    );

  // Obter conversa entre utilizador autenticado e outro utilizador
  router
    .route("/conversation/:otherUserId")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
      function (req, res, next) {
        const decoded = req.decoded || {};
        const userId = decoded.id;
        const otherUserId = req.params.otherUserId;

        const pageLimit = req.query.limit ? parseInt(req.query.limit) : 50;
        const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;

        const pagination = {
          limit: pageLimit,
          skip: pageSkip,
        };

        Messages.MessageService.findConversation(userId, otherUserId, pagination)
          .then((result) => {
            res.status(200).send({
              auth: true,
              messages: result.messages,
              pagination: result.pagination,
            });
            next();
          })
          .catch((err) => {
            console.error("Error fetching conversation:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    );

  return router;
};

module.exports = ChatRouter;

