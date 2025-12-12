const bodyParser = require("body-parser");
const express = require("express");
const MemberRequests = require("../data/member/memberRequestIndex");
const Users = require("../data/users");
const scopes = require("../data/users/scopes");
const VerifyToken = require("../middleware/Token");
const cookieParser = require("cookie-parser");

const MemberRequestsRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.use(cookieParser());
  router.use(VerifyToken);

  /**
   * @swagger
   * /member-requests:
   *   post:
   *     summary: Create a membership request (NonMember only)
   *     description: Create a new membership request. Only NonMember users can create requests. Requires NonMember authentication.
   *     tags: [Member Requests]
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Membership request created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Membership request submitted successfully"
   *                 request:
   *                   type: object
   *                   properties:
   *                     _id:
   *                       type: string
   *                     userId:
   *                       type: string
   *                     status:
   *                       type: string
   *                       example: "pending"
   *                     requestDate:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Bad request - Already has a pending request
   *       401:
   *         description: Unauthorized - NonMember access required
   */
  // Endpoint para NonMember pedir para ser sócio
  router
    .route("/")
    .post(Users.autorize([scopes.NonMember]), function (req, res, next) {
      const userId = req.decoded && req.decoded.id ? req.decoded.id : null;

      if (!userId) {
        return res.status(401).send({ error: "User ID not found in token" });
      }

      // Verificar se já existe um pedido pendente
      MemberRequests.findByUserId(userId)
        .then((existingRequests) => {
          const pendingRequest = existingRequests.find((r) => r.status === "pending");
          
          if (pendingRequest) {
            return res.status(400).send({ 
              error: "You already have a pending membership request" 
            });
          }

          // Criar novo pedido
          const requestData = {
            userId: userId,
            status: "pending",
            requestDate: new Date(),
          };

          return MemberRequests.create(requestData)
            .then((result) => {
              res.status(200).send({
                message: "Membership request submitted successfully",
                request: result.request,
              });
              next();
            });
        })
        .catch((err) => {
          console.error("Error creating membership request:", err);
          res.status(500).send({ error: err.message || "Error creating request" });
          next();
        });
    })
    /**
     * @swagger
     * /member-requests:
     *   get:
     *     summary: Get all membership requests (Admin only)
     *     description: Get a paginated list of all membership requests. Can filter by status. Requires admin authentication.
     *     tags: [Member Requests]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Number of requests to return
     *       - in: query
     *         name: skip
     *         schema:
     *           type: integer
     *           default: 0
     *         description: Number of requests to skip
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [pending, approved, rejected]
     *         description: Filter by status (optional)
     *     responses:
     *       200:
     *         description: List of membership requests
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 auth:
     *                   type: boolean
     *                   example: true
     *                 requests:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       _id:
     *                         type: string
     *                       userId:
     *                         type: string
     *                       status:
     *                         type: string
     *                         enum: [pending, approved, rejected]
     *                       requestDate:
     *                         type: string
     *                         format: date-time
     *       401:
     *         description: Unauthorized - Admin access required
     */
    // Endpoint para Admin ver todos os pedidos
    .get(Users.autorize([scopes.Admin]), function (req, res, next) {
      const pageLimit = req.query.limit ? parseInt(req.query.limit) : 10;
      const pageSkip = req.query.skip ? parseInt(req.query.skip) : 0;
      const status = req.query.status; // Opcional: filtrar por status

      const pagination = {
        limit: pageLimit,
        skip: pageSkip,
      };

      const queryPromise = status 
        ? MemberRequests.findByStatus(status)
        : MemberRequests.findAll(pagination);

      queryPromise
        .then((requests) => {
          res.status(200).send({
            auth: true,
            requests: requests,
          });
          next();
        })
        .catch((err) => {
          console.error("Error fetching requests:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  // Endpoint para utilizador ver seus próprios pedidos
  router
    .route("/my-requests")
    .get(Users.autorize([scopes.NonMember, scopes.Member]), function (req, res, next) {
      const userId = req.decoded && req.decoded.id ? req.decoded.id : null;

      if (!userId) {
        return res.status(401).send({ error: "User ID not found in token" });
      }

      MemberRequests.findByUserId(userId)
        .then((requests) => {
          res.status(200).send({
            auth: true,
            requests: requests,
          });
          next();
        })
        .catch((err) => {
          console.error("Error fetching user requests:", err);
          res.status(500).send({ error: err.message });
          next();
        });
    });

  /**
   * @swagger
   * /member-requests/{requestId}/approve:
   *   put:
   *     summary: Approve a membership request (Admin only)
   *     description: Approve a pending membership request. This will update the user's role to include Member scope. Requires admin authentication.
   *     tags: [Member Requests]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *         description: Membership request ID
   *     responses:
   *       200:
   *         description: Membership request approved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Membership request approved"
   *                 request:
   *                   type: object
   *       400:
   *         description: Bad request - Request is not pending
   *       401:
   *         description: Unauthorized - Admin access required
   *       500:
   *         description: Server error
   */
  // Endpoint para Admin aprovar pedido
  router
    .route("/:requestId/approve")
    .put(Users.autorize([scopes.Admin]), function (req, res, next) {
      const requestId = req.params.requestId;
      const adminId = req.decoded && req.decoded.id ? req.decoded.id : null;

      if (!adminId) {
        return res.status(401).send({ error: "Admin ID not found" });
      }

      MemberRequests.findById(requestId)
        .then((request) => {
          if (!request) {
            throw new Error("Request not found");
          }

          if (request.status !== "pending") {
            return res.status(400).send({ 
              error: "Request is not pending" 
            });
          }

          // Atualizar status do pedido
          return MemberRequests.update(requestId, {
            status: "approved",
            adminId: adminId,
            responseDate: new Date(),
          })
            .then((updatedRequest) => {
              // Atualizar utilizador para ser sócio
              // updatedRequest pode ter userId como objeto (populated) ou string
              let userId = null;
              if (updatedRequest.userId) {
                if (typeof updatedRequest.userId === 'object' && updatedRequest.userId._id) {
                  userId = updatedRequest.userId._id.toString();
                } else {
                  userId = updatedRequest.userId.toString();
                }
              }
              
              if (!userId) {
                throw new Error("User ID not found in request");
              }
              
              return Users.findUserById(userId)
                .then((user) => {
                  // Atualizar role do utilizador para incluir Member
                  const currentScopes = user.role && user.role.scope 
                    ? (Array.isArray(user.role.scope) ? user.role.scope : [user.role.scope])
                    : [];
                  
                  if (!currentScopes.includes(scopes.Member)) {
                    currentScopes.push(scopes.Member);
                  }

                  return Users.update(userId.toString(), {
                    "role.scope": currentScopes,
                  })
                    .then(() => {
                      res.status(200).send({
                        message: "Membership request approved",
                        request: updatedRequest,
                      });
                      next();
                    });
                });
            });
        })
        .catch((err) => {
          console.error("Error approving request:", err);
          res.status(500).send({ error: err.message || "Error approving request" });
          next();
        });
    });

  /**
   * @swagger
   * /member-requests/{requestId}/reject:
   *   put:
   *     summary: Reject a membership request (Admin only)
   *     description: Reject a pending membership request. Optionally provide a reason. Requires admin authentication.
   *     tags: [Member Requests]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *         description: Membership request ID
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Reason for rejection (optional)
   *                 example: "Incomplete documentation"
   *     responses:
   *       200:
   *         description: Membership request rejected successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Membership request rejected"
   *                 request:
   *                   type: object
   *       400:
   *         description: Bad request - Request is not pending
   *       401:
   *         description: Unauthorized - Admin access required
   */
  // Endpoint para Admin rejeitar pedido
  router
    .route("/:requestId/reject")
    .put(Users.autorize([scopes.Admin]), function (req, res, next) {
      const requestId = req.params.requestId;
      const adminId = req.decoded && req.decoded.id ? req.decoded.id : null;
      const { reason } = req.body;

      if (!adminId) {
        return res.status(401).send({ error: "Admin ID not found" });
      }

      MemberRequests.findById(requestId)
        .then((request) => {
          if (!request) {
            throw new Error("Request not found");
          }

          if (request.status !== "pending") {
            return res.status(400).send({ 
              error: "Request is not pending" 
            });
          }

          return MemberRequests.update(requestId, {
            status: "rejected",
            adminId: adminId,
            reason: reason || "No reason provided",
            responseDate: new Date(),
          })
            .then((updatedRequest) => {
              res.status(200).send({
                message: "Membership request rejected",
                request: updatedRequest,
              });
              next();
            });
        })
        .catch((err) => {
          console.error("Error rejecting request:", err);
          res.status(500).send({ error: err.message || "Error rejecting request" });
          next();
        });
    });

  return router;
};

module.exports = MemberRequestsRouter;

