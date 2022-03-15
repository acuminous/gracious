const { v4: uuid } = require('uuid');
const Store = require('./Store');

class TaskRegistry {
  static RUNNING = 'running';
  static CLOSING = 'closing';
  static CLOSED = 'closed';

  constructor() {
    this._store = new Store();
    this._state = TaskRegistry.RUNNING;
  }

  get count() {
    return this._store.size;
  }

  get isRunning() {
    return this._state === TaskRegistry.RUNNING;
  }

  get isClosing() {
    return this._state === TaskRegistry.CLOSING;
  }

  get isClosed() {
    return this._state === TaskRegistry.CLOSED;
  }

  get tasks() {
    return this._store.map((token, name, timestamp) => {
      return { token, name, timestamp };
    });
  }

  register(name) {
    if (!name) throw new Error('A task name is required');
    if (!this.isRunning) throw new Error(`Task "${name}" cannot be registered after calling close`);

    const token = uuid();
    this._store.set(token, name);
    return token;
  }

  clear(token) {
    if (!token) throw new Error('A token is required');
    if (this.isClosed) return;

    this._store.del(token);

    if (this.isClosing) this._resolveIfDrained();
  }

  async perform(name, fn) {
    const token = this.register(name);
    try {
      return await fn();
    } finally {
      this.clear(token);
    }
  }

  async close({ timeout = 0 } = {}) {
    if (!this.isRunning) return;

    this._state = TaskRegistry.CLOSING;
    try {
      await this._waitUntilDrained(timeout);
    } finally {
      this._state = TaskRegistry.CLOSED;
    }
  }

  reset() {
    this._state = TaskRegistry.RUNNING;
    this._store = new Store();
    delete this._resolve;
    delete this._timeoutId;
  }

  async _waitUntilDrained(timeout) {
    const promises = [this._waitForInflightTasks()];
    if (timeout > 0) promises.push(this._waitForTimeout(timeout));

    return Promise.race(promises).finally(() => {
      this._cleanUp();
    });
  }

  _waitForInflightTasks() {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._resolveIfDrained();
    });
  }

  _waitForTimeout(timeout) {
    return new Promise((resolve, reject) => {
      this._timeoutId = setTimeout(() => {
        const err = new Error(`Timedout after ${timeout}ms waiting for ${this.count} task(s) to complete`);
        err.tasks = this.tasks;
        reject(err);
      }, timeout).unref();
    });
  }

  _resolveIfDrained() {
    if (this.count === 0) this._resolve();
  }

  _cleanUp() {
    clearTimeout(this._timeoutId);
  }
}

module.exports = TaskRegistry;
