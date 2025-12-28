const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { authorize } = require("../../../../middleware/authorize");
const scopes = require("../../../../data/users/scopes");

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: List all clients
 *     tags: [Clients]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: trainerId
 *         schema:
 *           type: string
 *         description: Filter by trainer ID
 *     responses:
 *       200:
 *         description: List of clients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.get(
  "/",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.list
);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client profile
 *     tags: [Clients]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientCreate'
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.post(
  "/",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.create
);

/**
 * @swagger
 * /api/clients/me:
 *   get:
 *     summary: Get current user's client profile
 *     tags: [Clients]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Client profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.get("/me", authorize([scopes.Client]), controller.getMe);

/**
 * @swagger
 * /api/clients/me:
 *   put:
 *     summary: Update current user's client profile
 *     tags: [Clients]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientUpdate'
 *     responses:
 *       200:
 *         description: Client updated successfully
 */
router.put("/me", authorize([scopes.Client]), controller.updateMe);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client details
 */
router.get(
  "/:id",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.getById
);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Update client profile
 *     tags: [Clients]
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientUpdate'
 *     responses:
 *       200:
 *         description: Client updated successfully
 */
router.put(
  "/:id",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.update
);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete client (Admin only)
 *     tags: [Clients]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client deleted successfully
 */
router.delete("/:id", authorize([scopes.Admin]), controller.remove);

module.exports = router;

