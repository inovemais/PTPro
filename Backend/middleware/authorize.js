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

    // Token structure: decoded.role is an array of scopes OR an object with scope property
    // Handle both formats for compatibility
    let userScopes = [];
    if (Array.isArray(req.decoded.role)) {
      // Token format: { role: ["PersonalTrainer", "admin"] }
      userScopes = req.decoded.role;
    } else if (req.decoded.role.scope) {
      // Token format: { role: { scope: ["PersonalTrainer"] } }
      userScopes = Array.isArray(req.decoded.role.scope)
        ? req.decoded.role.scope
        : [req.decoded.role.scope];
    } else if (typeof req.decoded.role === 'string') {
      // Token format: { role: "PersonalTrainer" }
      userScopes = [req.decoded.role];
    }

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

