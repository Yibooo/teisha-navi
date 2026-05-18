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
    pricePerTsubo: v.optional(v.number()),
    isNewConstruction: v.boolean(),
    priceType: v.optional(v.union(
      v.literal("new_construction"),
      v.literal("listing"),
      v.literal("transaction"),
    )),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    // pricePerTsubo が未指定の場合は pricePerSqm から自動計算
    const data = {
      ...rest,
      pricePerTsubo: rest.pricePerTsubo ?? Math.round(rest.pricePerSqm * 3.30578 * 10) / 10,
    };
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
      newConstruction: all.filter((t) =>
        t.priceType === "new_construction" || t.isNewConstruction
      ).length,
      listing: all.filter((t) => t.priceType === "listing").length,
      transaction: all.filter((t) =>
        t.priceType === "transaction" || (!t.isNewConstruction && !t.priceType)
      ).length,
    };
  },
});
