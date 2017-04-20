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
    timestamp: -1,
    glycation: Constants.INITIAL_GLYCATION,
    glycationTimestamp: null,
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
      glucoseDelta: entity.value * Constants.MILLIS_PER_HOUR / entity.duration,
      type: activity.type,
      name: entity.name
    };
  }

  function isDone() {
    var timestamp = getNextSimulationTimestamp();
    return _.isUndefined(timestamp) || timestamp === null;
  }

  function advanceSimulation() {
    var timestamp = getNextSimulationTimestamp();
    var nextState = {};
    if (state.timestamp == -1) {
      nextState.glucose = state.glucose;
    } else {
      var delta = getCurrentGlucoseDelta() *
        (timestamp - state.timestamp) / Constants.MILLIS_PER_HOUR;
      // Javascript stores all numbers as floats internally, which can cause
      // us to oscillate around the resting glucose level.
      if (!state.currentActivities.length &&
          Math.sign(Constants.RESTING_GLUCOSE - state.glucose) !=
          Math.sign(Constants.RESTING_GLUCOSE - (state.glucose + delta))) {
          nextState.glucose = Constants.RESTING_GLUCOSE;
          nextState.glucoseDelta = 0;
      } else {
        nextState.glucose = state.glucose + delta;
      }
    }

    if (nextState.glucose >= (Constants.GLYCATION_THRESHOLD - .0001)) {
      nextState.glycationTimestamp = state.glycationTimestamp == null ?
        timestamp : state.glycationTimestamp;
    } else {
      nextState.glycationTimestamp = null;
    }

    if (state.glycationTimestamp == null) {
      nextState.glycation = state.glycation;
    } else {
      var leftoverMillis = (state.timestamp - state.glycationTimestamp) %
        Constants.SECONDS_PER_MINUTE;
      nextState.glycation = state.glycation +
        Math.floor(((timestamp + leftoverMillis) - state.timestamp) /
            Constants.MILLIS_PER_MINUTE);
    }
    // Remove ended activities and add those which start now.
    var startingActivities = _.map(
         _.filter(
           activityArray,
           function(activity) { return activity.timestamp == timestamp; }),
         function(activity) { return lookupActivity(activity); });
    nextState.currentActivities = _.filter(
        state.currentActivities,
        function(activity) {
          return activity.endingTimestamp > timestamp;
        }).concat(startingActivities);

    nextState.timestamp = timestamp;
    // Describe the started activities.
    _.each(startingActivities, function(activity) {
      console.log(`${new Date(timestamp)}, ${activity.type == 'food' ? 'ate' : 'did'} ${activity.name}`);
    });

    state = nextState;
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
        state.glucose < Constants.RESTING_GLUCOSE && glucoseDelta > 0){
          crossGlycationTimestamp = state.timestamp +
            (Constants.GLYCATION_THRESHOLD - state.glucose) *
            Constants.MILLIS_PER_HOUR / glucoseDelta;
    }

    // Ignore null and undefined values.
    var potentialTimestamps = _.filter(
        [nextActivityStartTimestamp, nextActivityEndTimestamp,
         crossRestingTimestamp, crossGlycationTimestamp],
         function(timestamp) {
           return !_.isUndefined(timestamp) && timestamp !== null;
         });
 
    // 15 minute interval for stats printing.
    if (state.timestamp != -1 && potentialTimestamps.length) {
      potentialTimestamps.push(Math.ceil(
            (state.timestamp + 1) / (15 * Constants.MILLIS_PER_MINUTE)) *
          (15 * Constants.MILLIS_PER_MINUTE));
    }

    var nextTimestamp = _.first(potentialTimestamps.sort());
    // Javascript stores all numbers internally as floats; we can get into some
    // trouble if we are less than one millisecond away from crossing a
    // threshold and get stuck in a loop 'advancing' to the present.
    return nextTimestamp == state.timestamp ? nextTimestamp + 1 : nextTimestamp;
  }

  that.runSimulation = function() {
    while(!isDone()) {
      advanceSimulation();
      console.log(`${new Date(state.timestamp)}, glucose: ${state.glucose.toFixed(1)}, glycation: ${state.glycation.toFixed(0)}`);
    }
  };

  return that;
};

module.exports = Simulation;
