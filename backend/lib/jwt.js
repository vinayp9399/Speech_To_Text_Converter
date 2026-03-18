const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;
const EXPIRY  = process.env.JWT_EXPIRY || "7d";

if (!SECRET) throw new Error("Missing JWT_SECRET in .env");

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
