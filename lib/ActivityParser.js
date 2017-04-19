var parse = require('csv-parse/lib/sync');
var isNumber = require('is-number');
var _ = require('underscore');

var ActivityParser = function(buffer) {
  var activityArray = parse(buffer);

  _.each(activityArray, function(value) {
    console.log("got activity: " + value[0] + ", " + value[1] + ", " + value[2]);
  });
  activityArray =
    _.map( 
      _.sortBy(
        _.filter(
          activityArray,
          function(entity) {
            return isNumber(entity[0]) &&
                _.contains(['food', 'exercise'], entity[1]) &&
                isNumber(entity[2]);
          }),
        function(entity) {
          return entity[0];
        }),
      function(row) {
        return {
          timestamp: parseInt(row[0]),
          type: row[1],
          id: parseInt(row[2])
        }
      });

  return activityArray;
}

module.exports = ActivityParser;
