const bodyParser = require("body-parser");
const express = require("express");
const cookieParser = require("cookie-parser");
const VerifyToken = require("../middleware/token");
const scopes = require("../data/users/scopes");
const Users = require("../data/users");
const Exercises = require("../data/exercises");

const ExercisesRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  router.use(cookieParser());
  router.use(VerifyToken);

  // ------- EXERCISES -------
  router
    .route("/")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
      function (req, res, next) {
        const pageLimit = req.query.limit ? parseInt(req.query.limit) : 100;
        const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;
        const search = req.query.search || "";
        const sort = req.query.sort || "createdAt";
        const category = req.query.category;
        const muscleGroup = req.query.muscleGroup;
        const difficulty = req.query.difficulty;
        const isActive = req.query.isActive;

        const pagination = {
          limit: pageLimit,
          skip: pageSkip,
        };

        Exercises.ExerciseService.findAll(
          { search, sort, category, muscleGroup, difficulty, isActive },
          pagination
        )
          .then((result) => {
            res.status(200).send({
              auth: true,
              exercises: result.exercises,
              pagination: result.pagination,
            });
            next();
          })
          .catch((err) => {
            console.error("Error fetching exercises:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .post(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer]),
      function (req, res, next) {
        const body = req.body;
        const userId = req.decoded?.id || req.decoded?._id;

        // Add createdBy if user is authenticated
        if (userId) {
          body.createdBy = userId;
        }

        Exercises.ExerciseService.create(body)
          .then((result) => {
            res.status(201).send({
              auth: true,
              message: result.message,
              exercise: result.exercise,
            });
            next();
          })
          .catch((err) => {
            console.error("Error creating exercise:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    );

  router
    .route("/:exerciseId")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
      function (req, res, next) {
        const exerciseId = req.params.exerciseId;

        Exercises.ExerciseService.findById(exerciseId)
          .then((exercise) => {
            res.status(200).send({
              auth: true,
              exercise: exercise,
            });
            next();
          })
          .catch((err) => {
            console.error("Error fetching exercise:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .put(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer]),
      function (req, res, next) {
        const exerciseId = req.params.exerciseId;
        const body = req.body;

        Exercises.ExerciseService.update(exerciseId, body)
          .then((exercise) => {
            res.status(200).send({
              auth: true,
              exercise: exercise,
            });
            next();
          })
          .catch((err) => {
            console.error("Error updating exercise:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .delete(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer]),
      function (req, res, next) {
        const exerciseId = req.params.exerciseId;

        Exercises.ExerciseService.removeById(exerciseId)
          .then((result) => {
            res.status(200).send({
              auth: true,
              message: result.message,
            });
            next();
          })
          .catch((err) => {
            console.error("Error deleting exercise:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    );

  return router;
};

module.exports = ExercisesRouter;

