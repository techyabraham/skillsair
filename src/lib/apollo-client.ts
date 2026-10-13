import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import type { ErrorResponse } from "@apollo/client/link/error";

const httpLink = createHttpLink({
  uri: "/api/graphql",
  credentials: "include",
});

const errorLink = onError(({ graphQLErrors, networkError }: ErrorResponse) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      if (process.env.NODE_ENV === "development") {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${String(path)}`
        );
      }
    });
  }
  if (networkError && process.env.NODE_ENV === "development") {
    console.error(`[Network error]: ${networkError}`);
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          courses: {
            keyArgs: ["where"],
            merge(_existing: unknown, incoming: unknown) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
    query: { fetchPolicy: "network-only" },
  },
});
