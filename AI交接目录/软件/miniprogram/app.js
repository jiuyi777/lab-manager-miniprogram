const { createServices } = require('./services/index');
App({ onLaunch() { this.services = createServices(); } });

