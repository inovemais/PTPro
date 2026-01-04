const bodyParser = require("body-parser");
const express = require("express");
const cookieParser = require("cookie-parser");
const VerifyToken = require("../middleware/token");
const scopes = require("../data/users/scopes");
const Users = require("../data/users");
const Trainers = require("../data/trainers");

const TrainerProfilesRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  router.use(cookieParser());

  // Listagem pública de personal trainers validados (para landing page)
  router.route("/public").get(function (req, res, next) {
    const pageLimit = req.query.limit ? parseInt(req.query.limit) : 10;
    const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;
    const search = req.query.search || "";
    const sort = req.query.sort || "createdAt";

    const pagination = {
      limit: pageLimit,
      skip: pageSkip,
    };

    Trainers.TrainerService.findAll(
      { search, sort, onlyValidated: true },
      pagination
    )
      .then((result) => {
        res.status(200).send({
          auth: false,
          trainers: result.trainers,
          pagination: result.pagination,
        });
        next();
      })
      .catch((err) => {
        console.error("Error fetching public trainers:", err);
        res.status(500).send({ error: err.message || "Error fetching trainers" });
        next();
      });
  });

  // A partir daqui, rotas autenticadas
  router.use(VerifyToken);

  // Admin pode gerir todos os trainers; trainer pode ver/editar o seu próprio perfil
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

        Trainers.TrainerService.findAll({ search, sort }, pagination)
          .then((result) => {
            res.status(200).send({
              auth: true,
              trainers: result.trainers,
              pagination: result.pagination,
            });
            next();
          })
          .catch((err) => {
            console.error("Error fetching trainers:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .post(Users.autorize([scopes.Admin]), function (req, res, next) {
      const body = req.body;

      Trainers.TrainerService.create(body)
        .then((result) => {
          res.status(200).send(result);
          next();
        })
        .catch((err) => {
          console.error("Error creating trainer:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  router
    .route("/:trainerId")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer]),
      function (req, res, next) {
        const trainerId = req.params.trainerId;

        Trainers.TrainerService.findById(trainerId)
          .then((trainer) => {
            if (!trainer) {
              return res.status(404).send({ error: "Trainer not found" });
            }
            res.status(200).send(trainer);
            next();
          })
          .catch((err) => {
            console.error("Error fetching trainer:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .put(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer]),
      function (req, res, next) {
        const trainerId = req.params.trainerId;
        const body = req.body;

        Trainers.TrainerService.update(trainerId, body)
          .then((trainer) => {
            res.status(200).send(trainer);
            next();
          })
          .catch((err) => {
            console.error("Error updating trainer:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .delete(Users.autorize([scopes.Admin]), function (req, res, next) {
      const trainerId = req.params.trainerId;

      Trainers.TrainerService.removeById(trainerId)
        .then(() => {
          res.status(200).send({ message: "Trainer removed" });
          next();
        })
        .catch((err) => {
          console.error("Error removing trainer:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  return router;
};

module.exports = TrainerProfilesRouter;

