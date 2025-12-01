import { gql } from "graphql-request";

export const GET_PRODUCTS = gql`
  query GetProducts {
    products(options: { take: 20 }) {
      items {
        id
        slug
        name
      }
    }
  }
`;
