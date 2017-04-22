var should = require('should');

var MyMath = require('../lib/MyMath');

describe('MyMath', function() {
  describe('intercept', function() {
    it('computes an intercept', function(done) {
      MyMath.intercept(0, 0, 1, 2).should.equal(2);

      MyMath.intercept(10, 20, 3, 26).should.equal(12);
      done();
    });

    it('handles negative slopes', function(done) {
      MyMath.intercept(4, 0, -1, -2).should.equal(6);

      MyMath.intercept(4, 2, -1, 20).should.equal(-14);
      done();
    });

    it('returns undefined if the slope is flat', function(done) {
      should.not.exist(MyMath.intercept(0, 0, 0, 1));
      done();
    });
  });

  describe('nextIntercept', function() {
     it('computes an intercept', function(done) {
      MyMath.nextIntercept(0, 0, 1, 2).should.equal(2);

      MyMath.nextIntercept(10, 20, 3, 26).should.equal(12);
      done();
    });

    it('handles negative slopes', function(done) {
      MyMath.nextIntercept(4, 0, -1, -2).should.equal(6);
      done();
    });

    it('returns undefined if the intercept is less than x', function(done) {
      should.not.exist(MyMath.nextIntercept(4, 2, -1, 20));
      done();
    });

    it('returns undefined if the slope is flat', function(done) {
      should.not.exist(MyMath.nextIntercept(0, 0, 0, 1));
      done();
    });
  });

});
