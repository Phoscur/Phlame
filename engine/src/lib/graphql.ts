import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  ExecutionResult,
  AsyncExecutionResult,
} from "graphql";

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      hello: {
        type: GraphQLString,
        resolve() {
          return "world";
        },
      },
    },
  }),
});

export default {
  schema,
  query: (
    graphqlQuery: string,
  ): Promise<ExecutionResult | AsyncIterableIterator<AsyncExecutionResult>> =>
    graphql(schema, graphqlQuery),
};
