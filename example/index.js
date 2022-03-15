const { globalTaskRegistry: registry } = require('..');

const intervalId = setInterval(async () => {
  const token = registry.register('Example');
  try {
    for (let i = 0; i < 10; i++) {
      await performStep(i);
    }
  } finally {
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

      await registry.close({ timeout: 5000 });

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
  });
}
