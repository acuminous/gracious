module.exports = async function (fn) {
  const before = Date.now();
  await fn();
  const after = Date.now();
  return after - before;
};
