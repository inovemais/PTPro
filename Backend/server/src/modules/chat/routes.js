const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { authorize } = require("../../../../middleware/authorize");
const scopes = require("../../../../data/users/scopes");

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send a message
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageCreate'
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post(
  "/",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  controller.sendMessage
);

/**
 * @swagger
 * /api/chat/conversation/{userId}:
 *   get:
 *     summary: Get conversation thread with another user
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Conversation messages
 */
router.get(
  "/conversation/:userId",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  controller.getConversation
);

/**
 * @swagger
 * /api/chat/threads:
 *   get:
 *     summary: Get all conversation threads for current user
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of conversation threads
 */
router.get(
  "/threads",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  controller.getThreads
);

/**
 * @swagger
 * /api/chat/workout-missed-alert:
 *   post:
 *     summary: Send alert message to client about missed workout (trainer only)
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *             properties:
 *               clientId:
 *                 type: string
 *               text:
 *                 type: string
 *               workoutDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Alert message sent successfully
 */
router.post(
  "/workout-missed-alert",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.sendWorkoutMissedAlert
);

module.exports = router;

