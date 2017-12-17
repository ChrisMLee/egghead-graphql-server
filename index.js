"use strict";

const express = require("express");
const graphqlHTTP = require("express-graphql");
// const {graphql, buildSchema} = require('graphql')
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInputObjectType
} = require("graphql");

const { getVideoById, getVideos, createVideo } = require("./src/data/index");
const { nodeInterface, nodeField } = require("./src/node");
const {
  globalIdField,
  connectionDefinitions,
  connectionFromPromisedArray,
  connectionArgs,
  mutationWithClientMutationId,
  cursorForObjectInConnection
} = require("graphql-relay");

const PORT = process.env.port || 3001;
const server = express();

/* instructor type example. since it uses the same id field as the video type, we can add the nodeInterface

const nodeInterface = new GraphQLInterfaceType({
  fields:{
    id:{
      type: new GraphQLNonNull(GraphqQLID)
    }
  }
})

const instructortType = new GraphQLObjectType({
  fields: {
    id: {
      type: GraphQLID,
      description: 'The id of the video'
    }
  },
  interfaces: [nodeInterface]
})

*/

const videoType = new GraphQLObjectType({
  name: "Video",
  description: "A video on Egghead.io",
  fields: {
    id: globalIdField(),
    title: {
      type: GraphQLString,
      description: "The title of the video."
    },
    duration: {
      type: GraphQLInt,
      description: "The duration of the video in seconds."
    },
    watched: {
      type: GraphQLBoolean,
      description: "Whether or not the viewer has watched the video."
    }
  },
  interfaces: [nodeInterface]
});

exports.videoType = videoType;

// connectionDefinitions returns a connectionType and its associated edgeType, given a node type.
const {
  connectionType: VideoConnection,
  edgeType: VideoEdge
} = connectionDefinitions({
  nodeType: videoType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: "A count of the total number of objects in this connection.",
      resolve: conn => {
        return conn.edges.length;
      }
    }
  })
});

/* via https://github.com/almope1516daw2/rework/blob/418586e7f8946925e8ea42a37528721a3228be88/graphql/type/PostConnection.js

export default connectionDefinitions({
  name: 'Post',
  nodeType: PostType
});
*/

/* non-connection syntax

   videos:{
   type: new GraphQLList(videoType),
   resolve: getVideos
   }


*/

// connectionFromPromisedArray :: (Promise -> [{}]) -> ConnectionArgs ->

const queryType = new GraphQLObjectType({
  name: "QueryType",
  description: "The root query type.",
  fields: {
    node: nodeField,
    video: {
      type: videoType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
          description: "the id of the video"
        }
      },
      resolve: (_, args) => {
        return getVideoById(args.id);
      }
    },
    videos: {
      type: VideoConnection,
      args: connectionArgs,
      resolve: (_, args) =>
        connectionFromPromisedArray(getVideos(), connectionArgs)
    }
  }
});

const videoInputType = new GraphQLInputObjectType({
  name: "VideoInput",
  fields: {
    id: {
      type: GraphQLID,
      description: "The id of the video."
    },
    title: {
      type: GraphQLString,
      description: "The title of the video."
    },
    duration: {
      type: GraphQLInt,
      description: "The duration of the video in seconds."
    },
    watched: {
      type: GraphQLBoolean,
      description: "Whether or not the viewer has watched the video."
    }
  }
});

const videoMutation = mutationWithClientMutationId({
  name: "AddVideo",
  inputFields: {
    title: {
      type: GraphQLString,
      description: "The title of the video."
    },
    duration: {
      type: GraphQLInt,
      description: "The duration of the video in seconds."
    },
    watched: {
      type: GraphQLBoolean,
      description: "Whether or not the viewer has watched the video."
    }
  },
  outputFields: {
    videoEdge: {
      type: VideoEdge,
      resolve: ({ video }, args) => {
        return getVideos()
          .then(existingVideos => {
            return {
              cursor: cursorForObjectInConnection(existingVideos, video),
              node: video
            };
          })
          .catch(error => error);
      }
    }
  },
  mutateAndGetPayload: args =>
    new Promise((resolve, reject) => {
      // this is will be fed in to the resolve function in outputFields
      // mock async using setTimeout
      setTimeout(
        () =>
          Promise.resolve(createVideo(args))
            .then(video => {
              resolve({ video });
            })
            .catch(reject),
        500
      );
    })
});

/* via https://github.com/almope1516daw2/rework/blob/418586e7f8946925e8ea42a37528721a3228be88/graphql/mutation/PostMutation.js

outputFields: {
  postEdge: {
    type: PostConnection.edgeType,
    resolve: (newPost, args, { db }) => {
      return {
        cursor: cursorForObjectInConnection(db.getPosts(), newPost),
        node: newPost,
      };
    },
  },
*/

/*
  {
    type: videoType,
    args: {
      video: {
        type: new GraphQLNonNull(videoInputType)
      }
    },
    resolve: (_, args) => {
      return createVideo(args.video)
    }
  }
*/

/* Relay compliant */
const mutationType = new GraphQLObjectType({
  name: "Mutation",
  description: "the root mutation type",
  fields: {
    createVideo: videoMutation
  }
});

// type on field is what you can query on after you run the mutation
// const mutationType = new GraphQLObjectType({
//   name: "Mutation",
//   description: "The root Mutation type.",
//   fields: {
//     createVideo: {
//       type: videoType,
//       args: {
//         video: {
//           type: new GraphQLNonNull(videoInputType)
//         }
//       },
//       resolve: (_, args) => {
//         return createVideo(args.video);
//       }
//     }
//   }
// });

/* Can also include:
   mutation,
   subscription
*/
const schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType
});

/*
const schema = buildSchema(`
type Video{
  id: ID,
  title: String,
  duration: Int,
  watched: Boolean
}

type Query{
  video: Video
  videos: [Video]
}

type Schema{
  query: Query
}
`)
*/

// way that GraphQl knows what to return is through resolvers
/*
const resolvers = {
  video: () => ({
    id: '1',
    title: 'bar',
    duration: 180,
    watched: true
  }),
  videos: () => videos
}
*/

// will get the field for each individual video
/*
const query = `
query myFirstQuery {
  videos {
    id
    title
    duration
    watched
  }
}
`
*/

/*
graphql(schema, query, resolvers)
.then(result => console.log(result))
  .catch(error => console.log(error))
*/

server.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
