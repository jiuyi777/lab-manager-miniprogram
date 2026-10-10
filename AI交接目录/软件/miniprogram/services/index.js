const { createStore, wxStorage } = require('../data/store');
const { createLocalServices } = require('./local');
// Composition root. The current provider is synchronous.
// HTTP adoption must make this contract async and migrate page handlers to await it.
// There is deliberately NO fake production mode, API token, or silent network fallback.
function createServices() { return createLocalServices(createStore(wxStorage())); }
module.exports = { createServices };
