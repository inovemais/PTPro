const scopes = require("../data/users/scopes");

/**
 * Middleware to authorize routes based on user roles/scopes
 * @param {Array<string>} allowedScopes - Array of allowed scopes
 */
function authorize(allowedScopes) {
  return (req, res, next) => {
    if (!req.decoded || !req.decoded.role) {
      return res.status(401).json({
        success: false,
        data: null,
        meta: {
          error: "Unauthorized - No role information",
        },
      });
    }

    const userScopes = Array.isArray(req.decoded.role.scope)
      ? req.decoded.role.scope
      : req.decoded.role.scope
      ? [req.decoded.role.scope]
      : [];

    const hasAccess = allowedScopes.some((scope) => userScopes.includes(scope));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        data: null,
        meta: {
          error: "Forbidden - Insufficient permissions",
        },
      });
    }

    next();
  };
}

module.exports = {
  authorize,
};

