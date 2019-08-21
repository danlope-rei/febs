#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const lib = require('../lib');

// Version check for node.js. Should be >= engines.node.
const febsPackageJson = fs.readFileSync(path.join(__dirname, '..', 'package.json'));
const enginesNodeVersion = JSON.parse(febsPackageJson.toString()).engines.node;
const minNodeVersion = enginesNodeVersion.split('').filter(c => Number.parseInt(c, 10) >= 0).join('.');

if (!lib.checkVersion(process.version, minNodeVersion)) {
  console.error(`⛔ febs requires at least node.js ${enginesNodeVersion}. You are on version ${process.version}`);
  process.exit(1);
}

// Log the current node version.
console.log(`✅ Current node version: ${process.version}.`);