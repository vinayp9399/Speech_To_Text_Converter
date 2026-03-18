const { ConvexHttpClient } = require("convex/browser");

if (!process.env.CONVEX_URL) {
  throw new Error("Missing CONVEX_URL in .env");
}

const convex = new ConvexHttpClient(process.env.CONVEX_URL);

module.exports = { convex };
