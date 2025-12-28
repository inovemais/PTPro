const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { authorize } = require("../../../../middleware/authorize");
const scopes = require("../../../../data/users/scopes");
const { uploadSingle } = require("../../../../middleware/upload");

/**
 * @swagger
 * /api/compliance:
 *   get:
 *     summary: List compliance logs
 *     tags: [Compliance]
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
 *         description: List of compliance logs
 */
router.get(
  "/",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  controller.list
);

/**
 * @swagger
 * /api/compliance:
 *   post:
 *     summary: Create compliance log (mark workout as completed/missed)
 *     tags: [Compliance]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ComplianceCreate'
 *     responses:
 *       201:
 *         description: Compliance log created successfully
 */
router.post(
  "/",
  authorize([scopes.Client]),
  uploadSingle("photo"),
  controller.create
);

/**
 * @swagger
 * /api/compliance/{id}:
 *   put:
 *     summary: Update compliance log
 *     tags: [Compliance]
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
 *             $ref: '#/components/schemas/ComplianceUpdate'
 *     responses:
 *       200:
 *         description: Compliance log updated successfully
 */
router.put(
  "/:id",
  authorize([scopes.Client]),
  uploadSingle("photo"),
  controller.update
);

/**
 * @swagger
 * /api/compliance/stats:
 *   get:
 *     summary: Get compliance statistics
 *     tags: [Compliance]
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
 *         description: Compliance statistics
 */
router.get(
  "/stats",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  controller.stats
);

module.exports = router;

