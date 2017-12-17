// via https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const videoA = {
  id: "a",
  title: "Create a GraphQL Schema",
  duration: 120,
  watched: true
};

const videoB = {
  id: "b",
  title: "Ember.js CLI",
  duration: 240,
  watched: false
};

const videos = [videoA, videoB];
const getVideoById = id =>
  new Promise(resolve => {
    const [video] = videos.filter(video => {
      return video.id === id;
    });

    resolve(video);
  });

const getVideos = () => new Promise(resolve => resolve(videos));

const createVideo = ({ title, duration, watched }) => {
  const video = {
    id: uuidv4(),
    title,
    duration,
    watched
  };
  console.log("createVideo called");
  videos.push(video);

  return video;
};

const getObjectById = (type, id) => {
  const types = {
    video: getVideoById
  };

  return types[type](id);
};

exports.getVideoById = getVideoById;
exports.getVideos = getVideos;
exports.createVideo = createVideo;
exports.getObjectById = getObjectById;
