const bodyParser = require("body-parser");
const express = require("express");
const cookieParser = require("cookie-parser");
const VerifyToken = require("../middleware/token");
const scopes = require("../data/users/scopes");
const Users = require("../data/users");
const Workouts = require("../data/workouts");

const TrainingPlansRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  router.use(cookieParser());
  router.use(VerifyToken);

  // ------- PLANOS DE TREINO -------
  router
    .route("/")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
      function (req, res, next) {
        const pageLimit = req.query.limit ? parseInt(req.query.limit) : 10;
        const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;
        const search = req.query.search || "";
        const sort = req.query.sort || "createdAt";
        const clientId = req.query.clientId;
        const trainerId = req.query.trainerId;
        const isActive = req.query.isActive;

        const pagination = {
          limit: pageLimit,
          skip: pageSkip,
        };

        Workouts.WorkoutService.findPlans(
          { search, sort, clientId, trainerId, isActive },
          pagination
        )
          .then((result) => {
            res.status(200).send({
              auth: true,
              plans: result.plans,
              pagination: result.pagination,
            });
            next();
          })
          .catch((err) => {
            console.error("Error fetching plans:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .post(Users.autorize([scopes.Admin, scopes.PersonalTrainer]), function (req, res, next) {
      const body = req.body;

      Workouts.WorkoutService.createPlan(body)
        .then((result) => {
          res.status(200).send(result);
          next();
        })
        .catch((err) => {
          console.error("Error creating plan:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  router
    .route("/:planId")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
      function (req, res, next) {
        const planId = req.params.planId;

        Workouts.WorkoutService.findPlanById(planId)
          .then((plan) => {
            if (!plan) {
              return res.status(404).send({ error: "Plan not found" });
            }
            res.status(200).send(plan);
            next();
          })
          .catch((err) => {
            console.error("Error fetching plan:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .put(Users.autorize([scopes.Admin, scopes.PersonalTrainer]), function (req, res, next) {
      const planId = req.params.planId;
      const body = req.body;

      Workouts.WorkoutService.updatePlan(planId, body)
        .then((plan) => {
          res.status(200).send(plan);
          next();
        })
        .catch((err) => {
          console.error("Error updating plan:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    })
    .delete(Users.autorize([scopes.Admin, scopes.PersonalTrainer]), function (req, res, next) {
      const planId = req.params.planId;

      Workouts.WorkoutService.removePlanById(planId)
        .then(() => {
          res.status(200).send({ message: "Plan removed" });
          next();
        })
        .catch((err) => {
          console.error("Error removing plan:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  return router;
};

module.exports = TrainingPlansRouter;

