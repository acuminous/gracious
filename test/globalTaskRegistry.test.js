const { ok } = require('assert');
const { globalTaskRegistry: registry } = require('..');
const time = require('./time');

describe('globalTaskRegistry', () => {
  it('should graciously wait for a task completion', async () => {
    const token = registry.register('t');

    setTimeout(() => {
      registry.clear(token);
    }, 200);

    const duration = await time(async () => {
      return registry.close();
    });

    ok(duration >= 200);
  });
});
