/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback, func-names */
const assert = require('assert');
const { exec } = require('child_process');

describe.only('Client Unit Testing', function () {
  describe('Integration Tests', function () {
    describe('JS-only unit tests', function () {
      it('should run specifying a directory', function (done) {
        exec('node bin/febs.js test test/fixtures/integration/js-only/test', (error, stdout, stderr) => {
          assert(stdout.includes('1 passing'));
          done();
        });
      });

      it('should run coverage', function (done) {
        exec('node bin/febs.js test test/fixtures/integration/js-only/test --cover', (error, stdout, stderr) => {
          assert(stdout.includes('% Stmts'));
          assert(stdout.includes('66.67'));
          done();
        });
      });

      it('should run with glob', function (done) {
        exec('node bin/febs.js test test/fixtures/integration/js-only/test/*.spec.js', (error, stdout, stderr) => {
          assert(stdout.includes('1 passing'));
          done();
        });
      });

      it('should run if no dir specified and test dirs exist', function (done) {
        exec('cd test/fixtures/integration/js-only && node ../../../../bin/febs.js test', (error, stdout, stderr) => {
          assert(stdout.includes('1 passing'));
          done();
        });
      });

      it('should error if no dir specified and no test dirs exist', function (done) {
        exec('cd test/fixtures/integration/js-only-no-test-dirs && node ../../../../bin/febs.js test', (error, stdout, stderr) => {
          assert(error.message.includes('Please specify test directory'));
          done();
        });
      });
    });

    describe('Vue only', function () {
      it('should run specifying a directory', function (done) {
        exec('node bin/febs.js test test/fixtures/integration/vue-only/test', (error, stdout, stderr) => {
          assert(stdout.includes('1 passing'));
          done();
        });
      });

      it('should run coverage', function (done) {
        exec('node bin/febs.js test test/fixtures/integration/vue-only/test --cover', (error, stdout, stderr) => {
          assert(stdout.includes('% Stmts'));
          assert(stdout.includes('50'));
          done();
        });
      });

      it('should run with glob', function (done) {
        exec('node bin/febs.js test test/fixtures/integration/vue-only/test/*.vue-spec.js', (error, stdout, stderr) => {
          assert(stdout.includes('1 passing'));
          done();
        });
      });
    });

    describe('Vue and JS', function () {
      it('should run specifying a directory', function (done) {
        exec('node bin/febs.js test test/fixtures/integration/js-and-vue/test', (error, stdout, stderr) => {
          assert(stdout.includes('2 passing'));
          done();
        });
      });

      it('should run run coverage', function (done) {
        exec('node bin/febs.js test test/fixtures/integration/js-and-vue/test --cover', (error, stdout, stderr) => {
          assert(stdout.includes('% Stmts'));
          assert(stdout.includes('66.67'));
          done();
        });
      });

      it('should run with glob', function (done) {
        exec('node bin/febs.js test "test/fixtures/integration/js-and-vue/test/*.js"', (error, stdout, stderr) => {
          assert(stdout.includes('2 passing'));
          done();
        });
      });
    });
  });
});
