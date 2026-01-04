const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { authorize } = require("../../../../middleware/authorize");
const scopes = require("../../../../data/users/scopes");
const { uploadSingle } = require("../../../../middleware/upload");

/**
 * @swagger
 * /api/workout-logs:
 *   get:
 *     summary: List workout logs
 *     tags: [WorkoutLogs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: trainerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of workout logs
 */
router.get(
  "/",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  controller.list
);

/**
 * @swagger
 * /api/workout-logs:
 *   post:
 *     summary: Create workout log (mark workout as completed/missed)
 *     tags: [WorkoutLogs]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutLogCreate'
 *     responses:
 *       201:
 *         description: Workout log created successfully
 */
router.post(
  "/",
  authorize([scopes.Client]),
  uploadSingle("photo"),
  controller.create
);

/**
 * @swagger
 * /api/workout-logs/{id}:
 *   put:
 *     summary: Update workout log
 *     tags: [WorkoutLogs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutLogUpdate'
 *     responses:
 *       200:
 *         description: Workout log updated successfully
 */
router.put(
  "/:id",
  authorize([scopes.Client]),
  uploadSingle("photo"),
  controller.update
);

/**
 * @swagger
 * /api/workout-logs/stats:
 *   get:
 *     summary: Get workout log statistics
 *     tags: [WorkoutLogs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: week
 *     responses:
 *       200:
 *         description: Workout log statistics
 */
router.get(
  "/stats",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  controller.stats
);

module.exports = router;

