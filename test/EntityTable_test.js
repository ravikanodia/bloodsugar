const fs = require('fs');
const should = require('should');
const EntityTable = require('../lib/EntityTable');

describe('EntityTable', function() {
  var foodTable;
  var exerciseTable;

  beforeEach(function() {
    foodTable = EntityTable.FoodTable(fs.readFileSync('./examples/food.csv'));
    exerciseTable =
        EntityTable.ExerciseTable(fs.readFileSync('./examples/exercise.csv'));
      });

  it('parses a CSV file', function(done) {
    foodTable.entities[1].name.should.equal("Banana cake, made with sugar");
    foodTable.entities[1].value.should.equal(47);
    done();
  });

  it('ignores lines that don\'t fit the pattern', function(done) {
    should.not.exist(foodTable.entities["ID"]);
    done();
  });

  it('labels food as food and gives it a two-hour duration', function(done) {
    foodTable.name.should.equal('food');
    foodTable.entities[2].duration.should.equal(2 * 60 * 60 * 1000);
    done();
  });

  it('labels exercise as exercise and gives it a two-hour duration', function(done) {
    exerciseTable.name.should.equal('exercise');
    exerciseTable.entities[2].duration.should.equal(1 * 60 * 60 * 1000);
    done();
  });
});
