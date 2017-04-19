// Define these in a function because declarations in an object can't be
// referenced later in the same declaration.
const Constants = (function() {
  var that = {};
  that.MILLIS_PER_SECOND = 1000;
  that.SECONDS_PER_MINUTE = 60;
  that.MINUTES_PER_HOUR = 60;
  that.MILLIS_PER_MINUTE = that.MILLIS_PER_SECOND * that.SECONDS_PER_MINUTE;
  that.MILLIS_PER_HOUR =
      that.MILLIS_PER_SECOND * that.SECONDS_PER_MINUTE * that.MINUTES_PER_HOUR;

  // Food makes glycemic index go up for two hours
  that.FOOD_AMPLITUDE = 1;
  that.FOOD_DURATION = 2 * that.MILLIS_PER_HOUR;

  // Exercise makes glycemic index go down for one hour
  that.EXERCISE_AMPLITUDE = -1;
  that.EXERCISE_DURATION = 1 * that.MILLIS_PER_HOUR;

  // Glucose starts at 80. When not being affected by food or exercise, glucose
  // approaches 80 at the rate of 1 per minute.
  that.RESTING_GLUCOSE = 80;
  that.RESTING_GLYCEMIC_MAGNITUDE = 60;
  
  // Glycation starts at 0. For each minute that glucose stays above 150,
  // increment the glycation counter by 1.
  that.INITIAL_GLYCATION = 0;
  that.GLYCATION_THRESHOLD = 150;
  that.GLYCATION_INTERVAL = 1 * that.MILLIS_PER_MINUTE;
  that.GLYCATION_AMOUNT = 1;

  return that;
})();

module.exports = Constants;
