/*
const {
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLID
} = require('graphql')
*/
const {
  nodeDefinitions,
  fromGlobalId
} = require('graphql-relay')

const {getObjectById} = require('./data')

//const {videoType} = require('../')

// first method: global id -> individual object
// second method: object -> what type of object it is
const {nodeInterface, nodeField} = nodeDefinitions(
  globalId => {
    const {type, id} = fromGlobalId(globalId)
    return getObjectById(type.toLowerCase(), id)
  },
  object => {
    if(object.title){
      const {videoType} = require('../')

      console.log(videoType)
      return videoType
    }

    return null
  }
)

/*
const nodeInterface = new GraphQLInterfaceType({
  name: 'Node',
  fields:{
    id:{
      type: new GraphQLNonNull(GraphQLID),
    }
  },
  resolveType: object => {
    if(object.title){
      return videoType
    }

    return null
  }
})
*/

exports.nodeInterface = nodeInterface
exports.nodeField = nodeField
