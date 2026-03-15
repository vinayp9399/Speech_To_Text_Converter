// middlewares/requireAuth.js
const { verifyToken } = require("../lib/jwt");

/**
 * Express middleware that validates a Bearer JWT.
 * On success it attaches `req.user = { userId, email }` and calls next().
 * On failure it returns 401.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header missing or malformed" });
  }

  const token = header.slice(7); // strip "Bearer "

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
