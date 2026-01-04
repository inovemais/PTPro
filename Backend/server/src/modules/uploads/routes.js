const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { authorize } = require("../../../../middleware/authorize");
const scopes = require("../../../../data/users/scopes");
const { uploadSingle, uploadMultiple } = require("../../../../middleware/upload");

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload a single file
 *     tags: [Uploads]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 description: Type of upload (profile, workout, document, etc.)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post(
  "/",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  uploadSingle("file"),
  controller.uploadSingle
);

/**
 * @swagger
 * /api/uploads/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Uploads]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 */
router.post(
  "/multiple",
  authorize([scopes.Admin, scopes.PersonalTrainer, scopes.Client]),
  uploadMultiple("files", 10),
  controller.uploadMultiple
);

module.exports = router;

