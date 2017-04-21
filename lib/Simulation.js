const _ = require('underscore');
const Constants = require('./Constants');

const Simulation = function(foodLookup, exerciseLookup, activityArray) {

  var lookups = {
    'food': foodLookup.entities,
    'exercise': exerciseLookup.entities
  };
  var activityArray = _.map(
      activityArray,
      function(activity) { return lookupActivity(activity); });

  var initialState = {
    glucose: Constants.RESTING_GLUCOSE,
    timestamp: -1,
    glycation: Constants.INITIAL_GLYCATION,
    glycationTimestamp: null,
    currentActivities: []
  };

  var states = [];

  var that = {};

  Object.defineProperty(that, 'state', {
    get: function() {
      return states.length ? states[states.length - 1] : initialState;
    }
  });

  Object.defineProperty(that, 'previousState', {
    get: function() {
      return (states.length >= 2) ? states[states.length - 2] : initialState;
    }
  });


  function lookupActivity(activity) {
    // This function will throw an exception if activity.type is not 'food' or
    // 'exercise', or if the id couldn't be found. That's probably the right
    // thing to do for now.
    var entity = lookups[activity.type][activity.id];
    var instance = {
      timestamp: activity.timestamp,
      type: activity.type,
      entity_id: activity.id,
      duration: entity.duration,
      name: entity.name,
      value: entity.value
    };
    Object.defineProperty(instance, 'endTimestamp', {
      get: function() {
       return activity.timestamp + entity.duration;
      }
    });
    Object.defineProperty(instance, 'glucoseDelta', {
      get: function() {
        return entity.value * Constants.MILLIS_PER_HOUR / entity.duration;
      }
    });
    return instance;
  }

  function isDone() {
    var timestamp = getNextSimulationTimestamp();
    return _.isUndefined(timestamp) || timestamp === null;
  }

  function advanceSimulation() {
    var timestamp = getNextSimulationTimestamp();
    var nextState = {};
    if (that.state.timestamp == -1) {
      nextState.glucose = that.state.glucose;
    } else {
      var delta = getCurrentGlucoseDelta() *
        (timestamp - that.state.timestamp) / Constants.MILLIS_PER_HOUR;
      // Javascript stores all numbers as floats internally, which can cause
      // us to oscillate around the resting glucose level.
      if (!that.state.currentActivities.length &&
          Math.sign(Constants.RESTING_GLUCOSE - that.state.glucose) !=
          Math.sign(Constants.RESTING_GLUCOSE -
            (that.state.glucose + delta))) {
          nextState.glucose = Constants.RESTING_GLUCOSE;
          nextState.glucoseDelta = 0;
      } else {
        nextState.glucose = that.state.glucose + delta;
      }
    }

    if (nextState.glucose >= (Constants.GLYCATION_THRESHOLD - .0001)) {
      nextState.glycationTimestamp = that.state.glycationTimestamp == null ?
        timestamp : that.state.glycationTimestamp;
    } else {
      nextState.glycationTimestamp = null;
    }

    if (that.state.glycationTimestamp == null) {
      nextState.glycation = that.state.glycation;
    } else {
      var leftoverMillis =
        (that.state.timestamp - that.state.glycationTimestamp) %
        Constants.SECONDS_PER_MINUTE;
      nextState.glycation = that.state.glycation +
        Math.floor(((timestamp + leftoverMillis) - that.state.timestamp) /
            Constants.MILLIS_PER_MINUTE);
    }

    nextState.currentActivities = _.filter(
        activityArray,
        function(activity) {
          return activity.timestamp <= timestamp &&
              activity.endTimestamp > timestamp;
        });

    nextState.timestamp = timestamp;
    states.push(nextState);
  }

  function getCurrentGlucoseDelta() {
    //var currentState =
    //  states.length ? states[states.length - 1] : initialState;
    if (that.state.currentActivities.length) {
      // Sum the values of all current activities.
      return _.reduce(
          _.pluck(that.state.currentActivities, 'glucoseDelta'),
          function(memo, value) {
            return memo + value;
          });
    } else if (that.state.glucose > Constants.RESTING_GLUCOSE) {
      return -1 * Constants.RESTING_GLYCEMIC_MAGNITUDE;
    } else if (that.state.glucose < Constants.RESTING_GLUCOSE) {
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
                  return activity.timestamp > that.state.timestamp;
                }),
                'timestamp'));
 
    // Get soonest endTimestamp
    var nextActivityEndTimestamp = _.first(
        _.pluck(that.state.currentActivities, 'endTimestamp').sort());

    var glucoseDelta = getCurrentGlucoseDelta();
    // Get timestamp when (if ever) glucose will cross resting level.
    var crossRestingTimestamp = null;
    if (that.state.glucose > Constants.RESTING_GLUCOSE && glucoseDelta < 0 ||
        that.state.glucose < Constants.RESTING_GLUCOSE && glucoseDelta > 0) {
        crossRestingTimestamp = that.state.timestamp +
            (Constants.RESTING_GLUCOSE - that.state.glucose) * 
            Constants.MILLIS_PER_HOUR / glucoseDelta;
    }

    // Get timestamp when (if ever) glucose will cross glycation threshold.
    var crossGlycationTimestamp = null;
    if (that.state.glucose > Constants.GLYCATION_THRESHOLD &&
        glucoseDelta < 0 ||
        that.state.glucose < Constants.RESTING_GLUCOSE && glucoseDelta > 0) {
          crossGlycationTimestamp = that.state.timestamp +
            (Constants.GLYCATION_THRESHOLD - that.state.glucose) *
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
    if (that.state.timestamp != -1 && potentialTimestamps.length) {
      potentialTimestamps.push(Math.ceil(
            (that.state.timestamp + 1) / (15 * Constants.MILLIS_PER_MINUTE)) *
          (15 * Constants.MILLIS_PER_MINUTE));
    }

    var nextTimestamp = _.first(potentialTimestamps.sort());
    // Javascript stores all numbers internally as floats; we can get into some
    // trouble if we are less than one millisecond away from crossing a
    // threshold and get stuck in a loop 'advancing' to the present.
    return (nextTimestamp == that.state.timestamp) ?
      nextTimestamp + 1 : nextTimestamp;
  }

  function getCurrentState() {
    return states.length ? states[states.length - 1] : initialState;
  }

  function outputState() {
    console.log(`${new Date(that.state.timestamp)}, glucose: ${that.state.glucose.toFixed(1)}, glycation: ${that.state.glycation.toFixed(0)}`);
    // Describe the started activities.
    _.each(
        _.difference(
          that.state.currentActivities,
          that.previousState.currentActivities),
        function(activity) {
          console.log(`${new Date(that.state.timestamp)}, ${activity.type == 'food' ? 'ate' : 'did'} ${activity.name}`);
        });
  }

  that.runSimulation = function() {
    if (!activityArray.length) {
      console.log("No activities specified in input file!");
      return;
    }
    while(!isDone()) {
      advanceSimulation();
      outputState();
   }
  };

  return that;
};

module.exports = Simulation;
