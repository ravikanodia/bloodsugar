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
      glucoseDelta: entity.value,
      type: activity.type,
      name: activity.name
    };
  }

  // TODO: This needs a lot of work.
  function isDone() {
    var timestamp = getNextSimulationTimestamp();
    return _.isUndefined(timestamp) || timestamp === null;
  }

  // TODO: this also needs a lot of work.
  function advanceSimulation() {
    processTimestamp(getNextSimulationTimestamp());
  }

  function processTimestamp(timestamp) {
    console.log(`processTimestamp: going from ${state.timestamp} to ${timestamp}`);
    state.glucoseDelta = getCurrentGlucoseDelta();
    console.log(`-- state.glucoseDelta: ${state.glucoseDelta}`);

    if (state.timestamp != -1) {
      var delta = state.glucoseDelta *
        (timestamp - state.timestamp) / Constants.MILLIS_PER_HOUR;
      // Javascript stores all numbers as floats internally, which can cause
      // us to oscillate around the resting glucose level.
      if (!state.currentActivities.length &&
          Math.sign(Constants.RESTING_GLUCOSE - state.glucose) !=
          Math.sign(Constants.RESTING_GLUCOSE - (state.glucose + delta))) {
          state.glucose = Constants.RESTING_GLUCOSE;
          state.glucoseDelta = 0;
      } else {
        state.glucose = state.glucose + delta;
      }
    }

    // Remove ended activities.
    state.currentActivities = _.filter(
        state.currentActivities,
        function(activity) { return activity.endingTimestamp > timestamp; });

    // Add activities which start now.
    state.currentActivities = state.currentActivities.concat(
       _.map(
         _.filter(
           activityArray,
           function(activity) { return activity.timestamp == timestamp; }),
         function(activity) { return lookupActivity(activity); }
         ));
    state.timestamp = timestamp;
  }

  function getCurrentGlucoseDelta() {
    if (state.currentActivities.length) {
      // Sum the values of all current activities.
      return _.reduce(
          _.pluck(state.currentActivities, 'glucoseDelta'),
          function(memo, value) {
            return memo + value;
          });
    } else if (state.glucose > Constants.RESTING_GLUCOSE) {
      return -1 * Constants.RESTING_GLYCEMIC_MAGNITUDE;
    } else if (state.glucose < Constants.RESTING_GLUCOSE) {
      return 1 * Constants.RESTING_GLYCEMIC_MAGNITUDE;
    } else {
      return 0;
    }
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
 
    // Get soonest endingTimestamp
    var nextActivityEndTimestamp =
        _.first(_.pluck(state.currentActivities, 'endingTimestamp').sort());

    var glucoseDelta = getCurrentGlucoseDelta();
    // Get timestamp when (if ever) glucose will cross resting level.
    var crossRestingTimestamp = null;
    if (state.glucose > Constants.RESTING_GLUCOSE && glucoseDelta < 0 ||
        state.glucose < Constants.RESTING_GLUCOSE && glucoseDelta > 0) {
        crossRestingTimestamp = state.timestamp +
            (Constants.RESTING_GLUCOSE - state.glucose) * 
            Constants.MILLIS_PER_HOUR / glucoseDelta;
    }

    // Get timestamp when (if ever) glucose will cross glycation threshold.
    var crossGlycationTimestamp = null;
    if (state.glucose > Constants.GLYCATION_THRESHOLD && glucoseDelta < 0 ||
        state.glucose < Constants.GLYCATION_THRESHOLD && glucoseDelta > 0) {
          crossGlycationTimestamp = state.timestamp +
            (Constants.GLYCATION_THRESHOLD - state.glucose) *
            Constants.MILLIS_PER_HOUR / glucoseDelta;
    }

    var nextTimestamp = _.first(
        _.filter(
          [nextActivityStartTimestamp, nextActivityEndTimestamp, crossRestingTimestamp, crossGlycationTimestamp],
          function(timestamp) {
            return !_.isUndefined(timestamp) && timestamp !== null;
          }).sort());

    // Javascript stores all numbers internally as floats; we can get into some
    // trouble if we are less than one millisecond away from crossing a
    // threshold and get stuck in a loop 'advancing' to the present.
    if (nextTimestamp == state.timestamp) {
      nextTimestamp = nextTimestamp + 1;
    }
    console.log(`-- delta ${glucoseDelta}. out of ${nextActivityStartTimestamp}, ${nextActivityEndTimestamp}, ${crossRestingTimestamp}, ${crossGlycationTimestamp}, chose lowest: ${nextTimestamp}`);
    return nextTimestamp;
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
