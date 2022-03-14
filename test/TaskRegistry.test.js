const { strictEqual: eq, ok, throws, rejects } = require('assert');
const { TaskRegistry } = require('..');
const time = require('./time');

describe('TaskRegistry', () => {
  it('requires as task name when registering tasks', async () => {
    const registry = new TaskRegistry();

    throws(
      () => {
        registry.register();
      },
      { message: 'A task name is required' }
    );
  });

  it('requires as token when clearing tasks', async () => {
    const registry = new TaskRegistry();

    throws(
      () => {
        registry.clear();
      },
      { message: 'A token is required' }
    );
  });

  it('graciously waits for a task to complete', async () => {
    const registry = new TaskRegistry();
    const token = registry.register('t');

    setTimeout(() => {
      registry.clear(token);
    }, 200);

    const duration = await time(async () => {
      return registry.close();
    });

    ok(duration >= 200);
  });

  it('graciously waits for a task to complete', async () => {
    const registry = new TaskRegistry();
    const token = registry.register('t');

    setTimeout(() => {
      registry.clear(token);
    }, 200);

    const duration = await time(async () => {
      return registry.close();
    });

    ok(duration >= 200);
  });

  it('wraps functions for convenience', async () => {
    const registry = new TaskRegistry();

    registry.wrap('t', () => {
      return new Promise((resolve) => {
        setTimeout(resolve, 200);
      })
    });

    const duration = await time(async () => {
      return registry.close();
    });

    ok(duration >= 200);
  })

  it('prevents tasks from being registered after closing', async () => {
    const registry = new TaskRegistry();

    await registry.close();

    await throws(
      () => {
        registry.register('t');
      },
      { message: 'Task "t" cannot be registered after calling close' }
    );
  });

  it('timeouts when a task takes too long to complete', async () => {
    const registry = new TaskRegistry();
    const token = registry.register('t');

    setTimeout(() => {
      registry.clear(token);
    }, 200);

    await rejects(
      async () => {
        await registry.close({ timeout: 100 });
      },
      { message: 'Timedout after 100ms waiting for 1 task(s) to complete' }
    );
  });

  it('provides the list of inflight tasks on timeout', async () => {
    const registry = new TaskRegistry();

    const before = Date.now();
    const token = registry.register('t');

    setTimeout(() => {
      registry.clear(token);
    }, 200);

    await rejects(
      async () => {
        await registry.close({ timeout: 100 });
      },
      (err) => {
        eq(err.tasks.length, 1);
        ok(err.tasks[0].token);
        eq(err.tasks[0].name, 't');
        ok(err.tasks[0].timestamp >= before);
        ok(err.tasks[0].timestamp <= Date.now());
        return true;
      }
    );
  });

  it('tolerates repeated closes', async () => {
    const registry = new TaskRegistry();
    await registry.close();
    await registry.close();
  });

  it('tolerates clearing missing tokens', async () => {
    const registry = new TaskRegistry();
    await registry.clear('missing');
  });

  it('tolerates clearing when closed', async () => {
    const registry = new TaskRegistry();
    await registry.close();
    await registry.clear('closed');
  });

  it('resets', async () => {
    const registry = new TaskRegistry();
    registry.register('t1');
    eq(registry.tasks.length, 1);
    eq(registry.tasks[0].name, 't1');

    try {
      await registry.close({ timeout: 100 });
    } catch(err) {
      // Timeout expected
    };

    registry.reset();

    const token = registry.register('t2');
    eq(registry.tasks.length, 1);
    eq(registry.tasks[0].name, 't2');
    registry.clear(token);
    await registry.close();
  })
});
