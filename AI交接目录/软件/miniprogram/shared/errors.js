function requireThat(condition, message) {
  if (!condition) throw new Error(message);
}
module.exports = { requireThat };

