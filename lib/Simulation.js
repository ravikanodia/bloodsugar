const _ = require('underscore');
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
    // Sum the values of all current activities.
    return _.reduce(
        state.currentActivities,
        function(memo, value) {
          return memo + value;
        });
  }

  function getNextSimulationTimestamp() {
    // Get timestamp of next activity in the input queue
    var nextActivityStartTimestamp =
        _.first(
            _.pluck(
                _.filter(activityArray, function(activity) {
                  return activity.timestamp > state.timestamp;
                }),
                'timestamp'));
    console.log(`nextActivityStartTimestamp: ${nextActivityStartTimestamp}`);
 
    // Get soonest endingTimestamp
    var nextActivityEndTimestamp =
        _.first(_.pluck(state.currentActivities, 'endingTimestamp').sort());
    console.log(`nextActivityEndTimestamp: ${nextActivityEndTimestamp}`);

    var glucoseDelta = getCurrentGlucoseDelta();
    // Get timestamp when (if ever) glucose will cross resting level.
    var crossRestingTimestamp = null;
    if (state.glucose > Constants.RESTING_GLUCOSE_LEVEL && glucoseDelta < 0 ||
        state.glucose < Constants.RESTING_GLUCOSE_LEVEL && glucoseDelta > 0) {
          crossRestingTimestamp = state.timestamp +
            (Constants.RESTING_GLUCOSE_LEVEL - state.glucose) *
            glucoseDelta / Constants.MILLIS_PER_HOUR;
    }
    console.log(`crossRestingTimestamp: ${crossRestingTimestamp}`);

    // Get timestamp when (if ever) glucose will cross glycation threshold.
    var crossGlycationTimestamp = null;
    if (state.glucose > Constants.GLYCATION_THRESHOLD && glucoseDelta < 0 ||
        state.glucose < Constants.GLYCATION_THRESHOLD && glucoseDelta > 0) {
          crossGlycationTImestamp = state.timestamp +
            (Constants.GLYCATION_THRESHOLD - state.glucose) *
            glucoseDelta / Constants.MILLIS_PER_HOUR;
    }
    console.log(`crossGlycationTimestamp: ${crossGlycationTimestamp}`);

    return _.first(
        _.filter(
          [nextActivityStartTimestamp, nextActivityEndTimestamp, crossRestingTimestamp, crossGlycationTimestamp],
          function(timestamp) {
            return timestamp !== null;
          }));
  }

  that.runSimulation = function() {
    while(!isDone()) {
      getNextSimulationTimestamp();
      advanceSimulation();
      console.log(`Current state: time: ${new Date(state.timestamp)}, glucose: ${state.glucose}`);
    }
  };

  return that;
};

module.exports = Simulation;
