# Gracious

Gracious is a library for allowing asynchronus tasks to gracefully complete.

[![NPM version](https://img.shields.io/npm/v/gracious.svg?style=flat-square)](https://www.npmjs.com/package/gracious)
[![NPM downloads](https://img.shields.io/npm/dm/gracious.svg?style=flat-square)](https://www.npmjs.com/package/gracious)
[![Node.js CI](https://github.com/acuminous/gracious/workflows/Node.js%20CI/badge.svg)](https://github.com/acuminous/gracious/actions?query=workflow%3A%22Node.js+CI%22)
[![Code Climate](https://codeclimate.com/github/acuminous/gracious/badges/gpa.svg)](https://codeclimate.com/github/acuminous/gracious)
[![Test Coverage](https://codeclimate.com/github/acuminous/gracious/badges/coverage.svg)](https://codeclimate.com/github/acuminous/gracious/coverage)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-brightgreen.svg)](https://github.com/prettier/prettier)
[![gracious](https://snyk.io/advisor/npm-package/gracious/badge.svg)](https://snyk.io/advisor/npm-package/gracious)
[![Discover zUnit](https://img.shields.io/badge/Discover-zUnit-brightgreen)](https://www.npmjs.com/package/zunit)

## TL;DR

```js
const { GlobalTaskRegistry: registry } = require('gracious');

['SIGTERM', 'SIGINT'].forEach((signal) => {
  // Register signal handlers to gracefully shutdown your application
  process.once(signal, () => {
    try {
      // Prevent new async tasks from arriving while you are gracefully shutting down
      await disconnectQueue();

      // Wait for inflight tasks to complete
      await registry.close({ timeout: 5000 });
    } catch (err) {
      console.error(err);
    }
  })
}

// Register and clear each instance of a task
function readMessage(message) {
  // Register the task
  const token = registry.register('my task');
  try {
    // Do some work
  } finally {
    // Clear the task
    registry.clear(token);
  }
}
```
