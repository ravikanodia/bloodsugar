const Constants = require('./Constants');

const Simulation = function(foodLookup, exerciseLookup, activityArray) {

  var lookups = {
    'food': foodLookup.entities,
    'exercise': exerciseLookup.entities
  };
  var activityArray = activityArray;

  var state = {
    glucose: Constants.RESTING_GLUCOSE,
    eventIndex: -1,
    timestamp: -1,
    glycation: Constants.INITIAL_GLYCATION,
    glucoseDelta: 0,
    currentActivities: []
  }

  var that = {};

  function lookupActivity(activity) {
    // This function will throw an exception if activity.type is not 'food' or
    // 'exercise', or if the id couldn't be found. That's probably the right
    // thing to do for now.
    var entity = lookups[activity.type][activity.id];
    return {
      startingTimestamp: activity.timestamp,
      endingTimestamp: activity.timestamp + entity.duration,
      glucoseDelta: entity.value
    };
  }

  // TODO: This needs a lot of work.
  function isDone() {
    return state.timestamp >= activityArray[activityArray.length - 1].timestamp;
  }

  // TODO: this also needs a lot of work.
  function advanceSimulation() {
    state.eventIndex = state.eventIndex + 1;
    // This isn't how this actually works but it illustrates the lookup.
    state.glucose += lookupActivity(activityArray[state.eventIndex]).glucoseDelta;
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
