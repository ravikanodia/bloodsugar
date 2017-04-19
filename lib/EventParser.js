var parse = require('csv-parse/lib/sync');
var isNumber = require('is-number');
var _ = require('underscore');

var EventParser = function(buffer) {
  var eventsArray = parse(buffer);

  _.each(eventsArray, function(value) {
    console.log("got event: " + value[0] + ", " + value[1] + ", " + value[2]);
  });
  eventsArray =
    _.map( 
      _.sortBy(
        _.filter(
          eventsArray,
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

  return eventsArray;
}

module.exports = EventParser;
