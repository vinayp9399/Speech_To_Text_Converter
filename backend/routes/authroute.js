// routes/authroute.js
const express = require("express");
const bcrypt  = require("bcrypt");
const router  = express.Router();

const { convex }     = require("../lib/convexClient");
const { signToken }  = require("../lib/jwt");
const { api }        = require("../convex/_generated/api");

const SALT_ROUNDS = 12;

// ── POST /auth/register ────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userId = await convex.mutation(api.users.create, {
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = signToken({ userId, email: email.toLowerCase().trim() });

    return res.status(201).json({ token, userId });
  } catch (err) {
    if (err.message?.includes("EMAIL_TAKEN")) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }
    console.error("[register]", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// ── POST /auth/login ───────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const user = await convex.query(api.users.getByEmail, {
      email: email.toLowerCase().trim(),
    });

    // Always run bcrypt to prevent timing-based user enumeration
    const hash = user ? user.passwordHash : "$2b$12$invalidhashpadding000000000000000000000000000000000000000";
    const match = await bcrypt.compare(password, hash);

    if (!user || !match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({ userId: user._id, email: user.email });

    return res.json({ token, userId: user._id });
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// ── GET /auth/me ───────────────────────────────────────────────────────────
// Lightweight token-check endpoint — useful for frontend session validation
router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const { verifyToken } = require("../lib/jwt");
    const payload = verifyToken(header.slice(7));

    const user = await convex.query(api.users.getById, { userId: payload.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ userId: user._id, email: user.email, createdAt: user.createdAt });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
