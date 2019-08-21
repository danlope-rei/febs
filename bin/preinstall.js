const fsExtra = require('fs-extra');
const path = require('path');
const logger = require('../lib/logger');
const lib = require('../lib');

// Version check for node.js. Should be >= engines.node.
const febsPackageJson = fsExtra.readJsonSync(path.join(__dirname, '..', 'package.json'));
const enginesNodeVersion = febsPackageJson.engines.node;
const minNodeVersion = enginesNodeVersion.split('').filter(c => Number.parseInt(c, 10) >= 0).join('.');

if (!lib.checkVersion(process.version, minNodeVersion)) {
  logger.error(`⛔ febs requires at least node.js ${enginesNodeVersion}. You are on version ${process.version}`);
  process.exit(1);
}

// Log the current node version.
logger.info(`✅ Current node version: ${process.version}.`);