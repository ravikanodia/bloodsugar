const Constants = require('./Constants');

const Simulation = function(foodLookup, exerciseLookup, activityArray) {

  var foodLookup = foodLookup;
  var exerciseLookup = exerciseLookup;
  var activityArray = activityArray;

  var state = {
    glucose: Constants.RESTING_GLUCOSE,
    eventIndex: -1,
    timestamp: -1,
    glycation: Constants.INITIAL_GLYCATION,
    glucoseDelta: 0
  }

  var that = {};

  // TODO: This needs a lot of work.
  function isDone() {
    return state.timestamp >= activityArray[activityArray.length - 1].timestamp;
  }

  // TODO: this also needs a lot of work.
  function advanceSimulation() {
    state.eventIndex = state.eventIndex + 1;
    state.timestamp = activityArray[state.eventIndex].timestamp;
  }

  function getCurrentGlucoseDelta() {

  }

  that.runSimulation = function() {
    while(!isDone()) {
      advanceSimulation();
      console.log(`Current state: time: ${new Date(state.timestamp)}, glucose: ${state.glucose}`);
    }
  };

  return that;
};

module.exports = Simulation;
