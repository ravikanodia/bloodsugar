var parse = require('csv-parse/lib/sync');
var isNumber = require('is-number');
var _ = require('underscore');
const Constants = require('./Constants');

function createTable(buffer, name, amplitude, duration) {
  var entitiesArray = parse(buffer);
  // Feels a little bulky. csv-parse might have options that trim this down.
  var entities =
    _.object(
      _.map(
       // Don't include headers or other rows without numeric ids.
       _.filter(
         entitiesArray,
         function(entity) {
           return isNumber(entity[0]) && isNumber(entity[2]);
         }),
       function(entity) {
         return [
           parseInt(entity[0]),
           {
              name: entity[1],
              value: parseInt(entity[2]) * amplitude,
              duration: duration
           }
         ];
       }));

  return {
    name: name,
    entities: entities
  };
}


// The table includes each entity's id, name, and magnitude.
// It doesn't say how long the effect lasts (duration), nor the name of the
// entire table, nor whether the effects of items in the table are positive
// (food) or negative (excerise).
var EntityTable = {
  FoodTable: function(buffer) {
    return createTable(
        buffer,
        'food',
        Constants.FOOD_AMPLITUDE,
        Constants.FOOD_DURATION);
  },

  ExerciseTable: function(buffer) {
    return createTable(
        buffer,
        'exercise',
        Constants.EXERCISE_AMPLITUDE,
        Constants.EXERCISE_DURATION);
  }

}

module.exports = EntityTable;
