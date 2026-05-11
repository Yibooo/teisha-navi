import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("transactions")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("transactions").collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("transactions")),
    propertyId: v.id("properties"),
    transactionYearQ: v.string(),
    transactionYear: v.number(),
    price: v.number(),
    areaSqm: v.number(),
    floor: v.optional(v.number()),
    remainingLeaseYears: v.number(),
    pricePerSqm: v.number(),
    isNewConstruction: v.boolean(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return ctx.db.insert("transactions", data);
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("transactions").collect();
    return {
      total: all.length,
      newConstruction: all.filter((t) => t.isNewConstruction).length,
      resale: all.filter((t) => !t.isNewConstruction).length,
    };
  },
});
