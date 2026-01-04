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

/**
 * @swagger
 * /api/clients/{id}/assign:
 *   post:
 *     summary: Assign a client to the logged-in trainer
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
 *         description: Client assigned successfully
 */
router.post(
  "/:id/assign",
  authorize([scopes.PersonalTrainer]),
  controller.assignToMe
);

/**
 * @swagger
 * /api/clients/available:
 *   get:
 *     summary: Find available users (clients without trainers)
 *     tags: [Clients]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
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
 *         description: List of available users
 */
router.get(
  "/available",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.findAvailableUsers
);

/**
 * @swagger
 * /api/clients/pending:
 *   get:
 *     summary: List pending clients (not validated)
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of pending clients
 */
router.get(
  "/pending",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.listPending
);

/**
 * @swagger
 * /api/clients/{id}/validate:
 *   post:
 *     summary: Validate a client registration
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
 *         description: Client validated successfully
 */
router.post(
  "/:id/validate",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.validate
);

module.exports = router;

