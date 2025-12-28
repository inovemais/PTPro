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

module.exports = router;

