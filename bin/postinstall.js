#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const semver = require('semver');

// Version check for node.js. Should be >= engines.node.
const febsPackageJson = fs.readFileSync(path.join(__dirname, '..', 'package.json'));
const enginesNodeVersion = JSON.parse(febsPackageJson.toString()).engines.node;

if (!semver.satisfies(semver.clean(process.version), enginesNodeVersion)) {
  console.error(`⛔ febs requires node.js ${enginesNodeVersion}. You are on version ${process.version}`);
  process.exit(1);
}

// Log the current node version.
console.log(`✅ Current node version: ${process.version}.`);
