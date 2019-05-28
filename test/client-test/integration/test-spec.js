/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback, func-names */
const assert = require('assert');
const util = require('util');
//const exec = util.promisify(require('child_process').exec);
const exec = require('child_process').exec;

describe.only('Client Unit Testing', function () {

  describe('Integration Tests', function () {

    describe('JS-only unit tests', function () {
        it('should run specifying a directory', async function () {
            const {stdout} = await exec('node bin/febs.js test test/fixtures/integration/js-only/test');
            assert(stdout.includes('1 passing'));
        });

        it('should run coverage', async function () {
            const {stdout} = await exec('node bin/febs.js test test/fixtures/integration/js-only/test --cover');
            assert(stdout.includes('66.67'));
        });

        it('should run with glob', async function () {
            const {stdout} = await exec('node bin/febs.js test test/fixtures/integration/js-only/test/*.spec.js');
            assert(stdout.includes('1 passing'));
        });

        it('should run if no dir specified and test dirs exist', async function () {
            const {stdout} = await exec('cd test/fixtures/integration/js-only && node ../../../../bin/febs.js test');
            assert(stdout.includes('1 passing'));
        });

        it('should error if no dir specified and no test dirs exist', async function () {
            try {
                const { stdout, stderr } = await exec('cd test/fixtures/integration/js-only-no-test-dirs && node ../../../../bin/febs.js test');
            } catch(err) {
                assert(err.message.includes('Please specify test directory'));
            }
        });

    });

      describe.only('Vue only', async function () {
          it('should run specifying a directory', function (done) {
              //const {error, stdout, stderr} = await exec('node bin/febs.js test test/fixtures/integration/vue-only/test');
              //console.log(error, stdout, stderr)
              exec('node bin/febs.js test test/fixtures/integration/vue-only/test', (error, stdout, stderr) => {
                  console.log(stdout)
                  assert(stdout.includes('1 passing'));
                  done();
              });
          });

          xit('Happy Path - coverage', function () {
              const ret = execSync('npx febs test test1-js-only --cover');
              assert(ret.includes('66.67'));
          });
      });

      describe('Vue and JS', function () {
          it('Happy Path', function () {
              const ret = execSync('npx febs test test1-js-only');
              assert(ret.includes('1 passing'));
          });

          it('Happy Path - coverage', function () {
              const ret = execSync('npx febs test test1-js-only --cover');
              assert(ret.includes('66.67'));
          });
      });
  });

});