// lib/jwt.js
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
const EXPIRY  = process.env.JWT_EXPIRY || "7d";

if (!SECRET) throw new Error("Missing JWT_SECRET in .env");

/**
 * Sign a JWT containing { userId, email }.
 * @param {{ userId: string, email: string }} payload
 * @returns {string} signed token
 */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

/**
 * Verify and decode a JWT.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @returns {{ userId: string, email: string }}
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
