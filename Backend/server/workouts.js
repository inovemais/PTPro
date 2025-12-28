const bodyParser = require("body-parser");
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs-extra");
const VerifyToken = require("../middleware/token");
const scopes = require("../data/users/scopes");
const Users = require("../data/users");
const Workouts = require("../data/workouts");

const WorkoutsRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  router.use(cookieParser());
  router.use(VerifyToken);

  // ------- PLANOS DE TREINO -------
  router
    .route("/plans")
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
    .route("/plans/:planId")
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

  // ------- REGISTOS DE TREINO (LOGS) -------
  router
    .route("/logs")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
      function (req, res, next) {
        const pageLimit = req.query.limit ? parseInt(req.query.limit) : 20;
        const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;
        const clientId = req.query.clientId;
        const trainerId = req.query.trainerId;
        const workoutPlanId = req.query.workoutPlanId;
        const from = req.query.from;
        const to = req.query.to;

        const pagination = {
          limit: pageLimit,
          skip: pageSkip,
        };

        Workouts.WorkoutService.findLogs(
          { clientId, trainerId, workoutPlanId, from, to },
          pagination
        )
          .then((result) => {
            res.status(200).send({
              auth: true,
              logs: result.logs,
              pagination: result.pagination,
            });
            next();
          })
          .catch((err) => {
            console.error("Error fetching logs:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    )
    .post(Users.autorize([scopes.Client]), function (req, res, next) {
      const body = req.body;

      // Processar imagem Base64 opcional
      if (body.base64image && body.base64image.startsWith("data:image/")) {
        try {
          const matches = body.base64image.match(
            /^data:image\/(\w+);base64,(.+)$/
          );
          if (!matches || matches.length !== 3) {
            return res
              .status(400)
              .send({ error: "Formato de imagem Base64 inválido" });
          }

          const imageType = matches[1];
          const base64Data = matches[2];
          const imageBuffer = Buffer.from(base64Data, "base64");

          const uploadsDir = path.join(__dirname, "../uploads/workouts");
          fs.ensureDirSync(uploadsDir);

          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const filename = `workout-${uniqueSuffix}.${imageType}`;
          const filepath = path.join(uploadsDir, filename);

          fs.writeFileSync(filepath, imageBuffer);

          body.photo = `/uploads/workouts/${filename}`;
          delete body.base64image;
        } catch (err) {
          console.error("Erro ao processar imagem Base64:", err);
          return res.status(500).send({ error: "Erro ao processar imagem" });
        }
      }

      Workouts.WorkoutService.createLog(body)
        .then((result) => {
          res.status(200).send(result);
          next();
        })
        .catch((err) => {
          console.error("Error creating workout log:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  router
    .route("/logs/:logId")
    .put(Users.autorize([scopes.Client]), function (req, res, next) {
      const logId = req.params.logId;
      const body = req.body;

      Workouts.WorkoutService.updateLog(logId, body)
        .then((log) => {
          res.status(200).send(log);
          next();
        })
        .catch((err) => {
          console.error("Error updating workout log:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  // Estatísticas para dashboards
  router
    .route("/stats")
    .get(
      Users.autorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
      function (req, res, next) {
        const clientId = req.query.clientId;
        const period = req.query.period || "week";

        Workouts.WorkoutService.statsByPeriod({ clientId, period })
          .then((stats) => {
            res.status(200).send({
              auth: true,
              stats,
            });
            next();
          })
          .catch((err) => {
            console.error("Error fetching stats:", err);
            res.status(500).send({ error: err.message });
            next();
          });
      }
    );

  return router;
};

module.exports = WorkoutsRouter;


