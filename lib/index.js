const vunit = require('@rei/vunit');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const logger = require('../lib/logger');
const glob = require('glob');
const fs = require('fs-extra');

// Directory we are calling febs from
const cwd = process.cwd();

const getUnitTestGlob = cmd => (cmd.testDirGlob
  ? path.join(cwd, cmd.testDirGlob)
  : path.join(cwd, '**/*.spec.js'));

/**
 * Get environment vars (for spawn)
 * @returns env vars object
 */
const getEnv = () => Object.assign({}, process.env, {
  BABEL_ENV: 'test',
});

/**
 *
 * @param cmd Commander command.
 *
 * @todo  show command line examples that this code bases itself off of.
 *
 * @todo    in docs, show what tools particular
 * commands depends upon. for example,
 * coverage depends on @istanbuljs/nyc-config-babel
 * .nycrc.json nyc mocha BABEL_ENV nyc@12(not 14!?)
 *
 * JS UTs: BABEL_ENV=test mocha --require @babel/register <glob>
 * Coverage: BABEL_ENV=test nyc mocha --require @babel/register <glob>
 */
// const runJsOnlyTests2 = (cmd) => {
//   logger.info('Running js only unit tests...');
//   const mochaOptions = [
//     '--colors',
//     '--require',
//     '@babel/register',
//     getUnitTestGlob(cmd),
//   ];
//   let mainCmd = 'mocha'; // Either mocha or nyc
//
//   if (cmd.watch) {
//     mochaOptions.unshift('--watch');
//   }
//
//   // Adjust the command based on whether
//   // or not we are running coverage.
//   if (cmd.cover) {
//     mainCmd = 'nyc';
//     mochaOptions.unshift('mocha');
//
//     // Add report options for nyc (text and json-summary)
//     if (cmd.report) {
//       mochaOptions.unshift('json-summary');
//       mochaOptions.unshift('--reporter');
//       mochaOptions.unshift('text');
//       mochaOptions.unshift('--reporter');
//     }
//   }
//
//   const mocha = spawn(mainCmd, mochaOptions, {
//     env: getEnv(),
//   });
//
//   mocha.stdout.on('data', (data) => {
//     const d = data.toString();
//     if (d !== os.EOL) {
//       process.stdout.write(d);
//     }
//   });
//
//   // Log errors.
//   mocha.stdout.on('error', (error) => {
//     if (error) console.log(error);
//   });
//
//   // Log errors.
//   mocha.stderr.on('data', (data) => {
//     console.log(data.toString());
//   });
//
//   mocha.on('exit', (code) => {
//     process.exitCode = code;
//   });
// };

const runJsOnlyTests = (cmd) => new Promise((resolve, reject) => {
  logger.info('Running js only unit tests...');
  const testSrc = getUnitTestGlob(cmd);

  const mochaOptions = [
      'mocha',
    '--colors',
    '--require',
    '@babel/register',
    testSrc,
  ];
  //let mainCmd = 'mocha'; // Either mocha or nyc

  if (cmd.watch) {
    mochaOptions.unshift('--watch');
  }

  // Adjust the command based on whether
  // or not we are running coverage.
  if (cmd.cover) {
    // mainCmd = 'nyc';
    mochaOptions.unshift('nyc');

    // Add report options for nyc (text and json-summary)
    if (cmd.report) {
      mochaOptions.unshift('json-summary');
      mochaOptions.unshift('--reporter');
      mochaOptions.unshift('text');
      mochaOptions.unshift('--reporter');
    }
  }

  console.log(mochaOptions)

  const mocha = spawn('npx', mochaOptions, {
    env: getEnv(),
  });

  let out = '';

  mocha.stdout.on('data', (data) => {
    const d = data.toString();
    if (d !== os.EOL) {
      process.stdout.write(d);
      out += d;
    }
  });

  // Log errors.
  mocha.stdout.on('error', (error) => {
    if (error) console.log(error);
  });

  // Log errors.
  mocha.stderr.on('data', (data) => {
    console.log(data.toString());
  });

  mocha.on('exit', (code) => {
    process.exitCode = code;
    resolve(out);
  });
});

const runVunit = (cmd) => {
    return vunit.run({
      spec: cmd.testDirGlob,
      // Ultimately, we'd like for febs and vunit to run
      // with the same webpack config. However, currently, when running
      // vunit with febs webpack.base.conf, the webpack compilation
      // is erroring when it hits the <style> tag in component. Using
      // the `vue-style-loader` in vunit fixes issue for now.
      // 'webpack-config': path.join(__dirname, '..', 'webpack-config', 'webpack.base.conf.js'),
      watch: cmd.watch,
      coverage: cmd.cover,
    });

};

/**
 * Run both Vue and JS unit tests.
 */
const runJsAndVue = (cmd) => {

  logger.info('Running vue and js unit tests...');

  return runVunit(cmd);
};

/**
 * Determine if only .js tests.
 *
 * testDirGlob a glob, a dir, a single file
 *
 * @param cmd
 * @returns boolean
 */
const onlyJsTests = (cmd, cwdIn = cwd) => {

  // if it contains a .js but no '*', it's a single file
  if (cmd.testDirGlob.includes('.js') && !cmd.testDirGlob.includes('*')) {
    return cmd.testDirGlob.includes('.spec.');
  }

  // Either a dir or a glob
  const files = cmd.testDirGlob.includes('*') ?
      glob.sync(path.join(cwdIn, cmd.testDirGlob)) :  // glob
      glob.sync(path.join(cwdIn, cmd.testDirGlob, '**', '*.js')); // dir

  return files.every(file => file.includes('.spec.'));
};

/**
 * Add default test dir to cmd by checking either for
 * /test or /src/test. Needed for the case
 * where no test dir is passed in. Otherwise,
 * throw exception.
 * @param cmd
 * @returns cmd with test dir glob
 */
const getCommandWithDefaultTestDir = cmd => {
  if (!cmd.testDirGlob) {
    // Check for these directories by default
    const dirs = ['test', 'src/test'];
    const testDir = dirs.filter(dir => fs.existsSync(path.join(cwd, dir)));

    if (testDir.length === 0) {
      throw new Error('Please specify test directory.');
    }
    return Object.assign({}, cmd, {
      testDirGlob: path.join(testDir[0], '**', '*.js')
    });
  }

  return cmd;
};

/**
 * Run either mocha (if js only) or vunit if vue.
 *
 * Test cases
    * directory only
    * directory with glob
    * nothing passed in
 *
 * @param cmd
 * @returns {void|*}
 */
const test = cmd => {
  const cmdUpdated = getCommandWithDefaultTestDir(cmd);
  if (onlyJsTests(cmdUpdated)) {
    return runJsOnlyTests(cmdUpdated);
  }

  return runJsAndVue(cmdUpdated);
};

module.exports = {
  test,
  onlyJsTests,
  getCommandWithDefaultTestDir
};
