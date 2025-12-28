const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { authorize } = require("../../../../middleware/authorize");
const scopes = require("../../../../data/users/scopes");

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: List training plans
 *     tags: [Plans]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of training plans
 */
router.get(
  "/",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  controller.list
);

/**
 * @swagger
 * /api/plans:
 *   post:
 *     summary: Create a new training plan
 *     tags: [Plans]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanCreate'
 *     responses:
 *       201:
 *         description: Plan created successfully
 */
router.post(
  "/",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.create
);

/**
 * @swagger
 * /api/plans/{id}:
 *   get:
 *     summary: Get plan by ID
 *     tags: [Plans]
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
 *         description: Plan details
 */
router.get(
  "/:id",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  controller.getById
);

/**
 * @swagger
 * /api/plans/{id}:
 *   put:
 *     summary: Update training plan
 *     tags: [Plans]
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
 *             $ref: '#/components/schemas/PlanUpdate'
 *     responses:
 *       200:
 *         description: Plan updated successfully
 */
router.put(
  "/:id",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.update
);

/**
 * @swagger
 * /api/plans/{id}:
 *   delete:
 *     summary: Delete training plan
 *     tags: [Plans]
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
 *         description: Plan deleted successfully
 */
router.delete(
  "/:id",
  authorize([scopes.Admin, scopes.PersonalTrainer]),
  controller.remove
);

module.exports = router;

