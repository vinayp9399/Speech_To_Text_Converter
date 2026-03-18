import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get a user by email — used during login
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

// Get a user by their Convex _id — used to validate JWT owner
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Create a new user — throws EMAIL_TAKEN if duplicate
export const create = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, { email, passwordHash }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) throw new Error("EMAIL_TAKEN");

    return await ctx.db.insert("users", {
      email,
      passwordHash,
      createdAt: Date.now(),
    });
  },
});
