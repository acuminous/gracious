class Store {
  constructor() {
    this._store = {};
  }

  set(key, value) {
    this._store[key] = { value, timestamp: Date.now() };
  }

  del(token) {
    delete this._store[token];
  }

  map(fn) {
    return Object.keys(this._store).map((key) => {
      return fn(key, this._store[key].value, this._store[key].timestamp);
    });
  }

  get size() {
    return Object.keys(this._store).length;
  }
}

module.exports = Store;
