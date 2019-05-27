const util = require('util'),
  { AsyncIterator } = require('asynciterator'),
  EventEmitter = require('events').EventEmitter;

var StreamIterator = function (stream) {
  this._iterator = AsyncIterator.wrap(stream);
  this._currentCB;
  this._currentPromise;
};

util.inherits(StreamIterator, EventEmitter);

StreamIterator.prototype.getCurrentObject = function () {
  return this._currentObject;
};

StreamIterator.prototype.next = function (callback) {
  return new Promise(async (resolve, reject) => {
    this._currentCB = callback;
    this._currentPromise = resolve;
    var object = this._iterator.read();
    if (!object && !this._iterator.ended && this._iterator._state < 2) {
      this._iterator.once("readable", async () => {
        object = await this.next(callback)
        resolve(object);
      });
      //Filter our object on the date property and check whether it’s in our interval.
    } else if (object) {
      this._currentObject = object;
      if (callback)
        callback(object);
      resolve(object);
    } else if (!object) {
      //stream ended
      this._currentObject = null;
      if (callback)
        callback(null);
      resolve(null);
    } else {
      //We didn't find a solution this time, let's find it next time
      resolve(await this.next(callback));
    }
  });
};

module.exports = StreamIterator;

