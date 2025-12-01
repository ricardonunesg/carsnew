import { GraphQLClient } from "graphql-request";

export const shopApiUrl =
  process.env.VENDURE_API_URL ?? "http://127.0.0.1:3000/shop-api";

export const vendure = new GraphQLClient(shopApiUrl, {
  headers: {
    "Content-Type": "application/json",
  },
});
