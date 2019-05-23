/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback, func-names */

const assert = require('assert');
const test = require('../lib').test;
const {execSync} = require('child_process');

describe.only('Client Unit Testing', function () {

  describe('Integration Tests', function () {

      /**
       * Todo, handle errors/test failures with exec.
       * async? promise?
       */

    describe('JS only', function () {
        it('Specify a directory', function () {
            const ret = execSync('npx febs test test/integration/js-only/test');
            assert(ret.includes('1 passing'));
        });

        it('Coverage', function () {
            const ret = execSync('npx febs test test1-js-only --cover');
            assert(ret.includes('66.67'));
        });

        it.only('Specify a glob', function () {
            const ret = execSync('npx febs test test/integration/js-only/test/*.spec.js');
            assert(ret.includes('1 passing'));
        });

        it('Nothing specified', function () {
            const ret = execSync('npx febs test test1-js-only --cover');
            assert(ret.includes('66.67'));
        });

    });

      describe('Vue only', function () {
          it('Happy Path', function () {
              const ret = execSync('npx febs test test1-js-only');
              assert(ret.includes('1 passing'));
          });

          it('Happy Path - coverage', function () {
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