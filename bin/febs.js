#!/usr/bin/env node
const febs = require('../index.js');
const program = require('commander');
//const minimist = require('minimist');

// Set default command to 'build' (commander {isDefault: true} not working..)
process.argv[2] = process.argv[2] ? process.argv[2] : 'build';

//var argv = require('minimist')(process.argv.slice(3));
//console.log(argv)

program
  .usage('[task] [options]')
  .description('Builds and bundles front-end assets with minimal configuration\n')
  .version(require('../package.json').version)
  .option('-v, --verbose', 'Increase logging verbosity of build system')
  .option('--debug', 'Higher level of verbosity, including debug output');

program
  .command('build')
  .description('(Default) Builds front-end assets optimized for production\n')
  .action((command) => {
    febs(command, {
      logLevel: command.parent.verbose ? 'verbose' : 'info',
    }).compile();
  });

program
  .command('prod')
  .description('Builds front-end assets optimized for production\n')
  .action((command) => {
    febs(command, {
      logLevel: command.parent.verbose ? 'verbose' : 'info',
    }).compile();
  });

program
  .command('dev')
  .description('Builds/Serves front-end assets optimized for local development\n')
  .option('--no-dev-server', 'Run dev build with no development server.')
  .option('--watch', 'Run dev build in watch mode.')
  .action((command) => {
    if (command.devServer) {
      febs(command, {
        logLevel: command.parent.verbose ? 'verbose' : 'info',
      }).startDevServer();
    } else {
      febs(command, {
        logLevel: command.parent.verbose ? 'verbose' : 'info',
      }).compile();
    }
  });

program
  .command('test')
  .description('Runs unit tests.\n')
    .option('--js', 'Run javascript (only) unit tests.')
    .option('--vue', 'Run vue (only) unit tests')
    .option('--watch [dirsToWatch]', 'Run unit tests in watch mode.')
    .option('--cover', 'Run unit test coverage report')
    .option('--report', 'Save unit test coverage report')
  .action((...args) => {

      let command;
      // if both passed, testDir, command
      // if testDir not specified
      // command, undefined
      if (args[0] && args[1]) {
          command = Object.assign(args[1], {
              testDirGlob: args[0]
          })
      } else {
          command = args[0];
      }

    febs(command, {
      logLevel: command.parent.verbose ? 'verbose' : 'info',
    }).runTests();
  });

program
  .on('--help', () => {
    process.stdout.write(`  Examples:
        $ NODE_ENV=prod febs
        $ NODE_ENV=dev febs dev --no-dev-server
        $ NODE_ENV=dev febs dev --no-dev-server --watch
        $ NODE_ENV=dev febs dev (starts dev-server)
        $ NODE_ENV=prod febs [build|prod] --verbose
        $ NODE_ENV=prod febs test [--js|--vue|--watch|--cover]
    `);
  });

program.parse(process.argv);
