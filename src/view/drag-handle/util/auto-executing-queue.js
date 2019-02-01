export default function() {
  this.isBlocked = false;
  this.pendingFns = [];

  this.schelude = function(fn) {
    if (this.isBlocked) {
      this.pendingFns.push(fn);
    } else {
      fn();
    }
  };

  this.block = function() {
    this.isBlocked = true;
    console.log('Context on block', this);
  };

  this.unblock = function() {
    this.isBlocked = false;
    this.pendingFns.forEach(f => f());

    console.log('Context on unblock', this);

    this.pendingFns = [];
  };
}
