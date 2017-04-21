const _ = require('underscore');
const fs = require('fs');
const should = require('should');
const ActivityParser = require('../lib/ActivityParser');

describe('ActivityParser', function() {
  var activityArray;

  beforeEach(function() {
    activityArray = ActivityParser(fs.readFileSync('./examples/input.csv'));
      });

  it('parses a CSV file', function(done) {
    activityArray.length.should.equal(9);

    activityArray[0].timestamp.should.equal(1495202400000);
    activityArray[0].type.should.equal('food');
    activityArray[0].id.should.equal(29);
    done();
  });

  it('ignores lines that don\'t fit the pattern', function(done) {
    _.contains(
      _.pluck(activityArray, 'timestamp'), 'TIMESTAMP').should.equal(false);
    done();
  });

});
