const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { authorize } = require("../../../../middleware/authorize");
const scopes = require("../../../../data/users/scopes");

/**
 * @swagger
 * /api/change-requests:
 *   post:
 *     summary: Create a trainer change request (Client only)
 *     tags: [Change Requests]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangeRequestCreate'
 *     responses:
 *       201:
 *         description: Change request created successfully
 */
router.post("/", authorize([scopes.Client]), controller.create);

/**
 * @swagger
 * /api/change-requests:
 *   get:
 *     summary: List change requests (Admin only)
 *     tags: [Change Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
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
 *     responses:
 *       200:
 *         description: List of change requests
 */
router.get("/", authorize([scopes.Admin]), controller.list);

/**
 * @swagger
 * /api/change-requests/{id}/approve:
 *   put:
 *     summary: Approve change request (Admin only)
 *     tags: [Change Requests]
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
 *         description: Request approved and client trainer updated
 */
router.put("/:id/approve", authorize([scopes.Admin]), controller.approve);

/**
 * @swagger
 * /api/change-requests/{id}/reject:
 *   put:
 *     summary: Reject change request (Admin only)
 *     tags: [Change Requests]
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
 *         description: Request rejected
 */
router.put("/:id/reject", authorize([scopes.Admin]), controller.reject);

module.exports = router;

