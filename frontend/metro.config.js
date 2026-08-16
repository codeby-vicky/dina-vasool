const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limit parallel worker processes - prevents "JavaScript heap out of memory"
// crashes on machines running many other apps alongside the bundler.
config.maxWorkers = 2;

module.exports = config;