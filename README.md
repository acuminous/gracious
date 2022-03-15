# Gracious

Gracious is a library that faciliates the graceful shutdown of Node.js applications.

[![NPM version](https://img.shields.io/npm/v/gracious.svg?style=flat-square)](https://www.npmjs.com/package/gracious)
[![NPM downloads](https://img.shields.io/npm/dm/gracious.svg?style=flat-square)](https://www.npmjs.com/package/gracious)
[![Node.js CI](https://github.com/acuminous/gracious/workflows/Node.js%20CI/badge.svg)](https://github.com/acuminous/gracious/actions?query=workflow%3A%22Node.js+CI%22)
[![Code Climate](https://codeclimate.com/github/acuminous/gracious/badges/gpa.svg)](https://codeclimate.com/github/acuminous/gracious)
[![Test Coverage](https://codeclimate.com/github/acuminous/gracious/badges/coverage.svg)](https://codeclimate.com/github/acuminous/gracious/coverage)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-brightgreen.svg)](https://github.com/prettier/prettier)
[![gracious](https://snyk.io/advisor/npm-package/gracious/badge.svg)](https://snyk.io/advisor/npm-package/gracious)
[![Discover zUnit](https://img.shields.io/badge/Discover-zUnit-brightgreen)](https://www.npmjs.com/package/zunit)

## Why use gracious?

When you deploy a Node.js application, the previous version is usually terminated by sending a SIGINT or SIGTERM signal to the main process. Unless handled, the application will stop abruptly, interrupting any inflight work. Even in well designed systems, failing to complete a unit of work, or attempting to perform it twice, is likely to create problems such has confusing logs, but in poorly designed systems this could result in data loss or inconsistency. By deferring shutdown until inflight work is complete, you minimise these undersireable side effects. This is where Gracious comes in.

## How does it work?

Gracious provides a TaskRegistry for tracking inflight units of work. Whenever your application starts a new unit of work you must record it in the registry, then clear the entry when the task completes.
In addition, when sent a SIGINT and SIGTERM events, you must prevent the application starting new units of work, and wait for the registry to close. The registry will only close when all inflight units of work are complete, or after a configurable timeout. The default timeout is 3 seconds.

## Example Usage

```js
const { globalTaskRegistry: registry } = require('..');

const intervalId = setInterval(async () => {
  // Record the start of a unit of work
  const token = registry.register('Example');
  try {
    for (let i = 0; i < 10; i++) {
      await performStep(i);
    }
  } finally {
    // Record that the task has completed
    registry.clear(token);
  }
}, 2000);

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.once(signal, async () => {
    try {
      console.log(`Received ${signal}`);

      // Stop accepting new work
      clearInterval(intervalId);

      console.log(`Waiting for ${registry.count} task(s) to complete`);

      // Wait for the registry to close
      await registry.close();

      console.log('Done');

      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
});

function performStep(i) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Performing step ${i + 1}`);
      resolve();
    }, 100);
  }
```

## Good to know

### Alternative Usage

Top and tailing tasks between `register` and `clear` calls can get onerous, and if the `clear` call is bypassed, will cause a memory leak. As an alternative consider using the `perform` function, i.e.

```js
await registry.perform('Example', async () => {
  for (let i = 0; i < 10; i++) {
    await performStep(i);
  }
});
```

### Configurable Timeous

The default timeout of three seconds can be overriden as follows

```js
// Timeout after five seconds
await registry.close({ timeout: 5000 });

// Disable the timeout completely
await registry.close({ timeout: 0 }};
```

### Multiple Registries

Gracious ships with a shared global registry, but you do not have to use it. You can instantiate your own TaskRegistries registry as follows

```js
const { TaskRegistry } = require('..');
const taskRegistry = new TaskRegistry();
```
