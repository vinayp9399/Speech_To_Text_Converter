import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email:        v.string(),
    passwordHash: v.string(),
    createdAt:    v.number(),
  }).index("by_email", ["email"]),

  audioFiles: defineTable({
    userId:     v.id("users"),
    storageId:  v.string(),
    filename:   v.string(),
    mimeType:   v.string(),
    sizeBytes:  v.number(),
    uploadedAt: v.number(),
  }).index("by_user", ["userId"]),

  transcripts: defineTable({
    userId:      v.id("users"),
    audioFileId: v.id("audioFiles"),
    text:        v.string(),
    createdAt:   v.number(),
  })
    .index("by_user",       ["userId"])
    .index("by_audio_file", ["audioFileId"]),
});
