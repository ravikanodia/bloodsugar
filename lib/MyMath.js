var Math = (function() {
  var that = {};
  // Computes the intercept of a slope m through point x,y with a line at y = t
  that.intercept = function(x, y, m, t) {
    if (m === 0) {
      return undefined;
    }
    
    return x + (t - y) / m;
  };

  // Same as intercept, but returns undefined for values not greater than x
  that.nextIntercept = function(x, y, m, t) {
    var intercept = that.intercept(x, y, m, t);
    return intercept > x ? intercept : undefined;
  };

  return that;
})();

module.exports = Math;
