/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback, func-names */
const assert = require('assert');

describe('Unit Tests for lib/test', function () {

    const {onlyJsTests, getCommandWithDefaultTestDir} = require('../../../lib');

    describe('getCommandWithDefaultTestDir', function () {

        it('should return cmd if testDirGlob present', function () {
            const cmd = {testDirGlob: 'some/dir'};
            assert.deepEqual(getCommandWithDefaultTestDir(cmd), cmd);
        });

        it('should set testDirGlob to /test if testDirGlob empty', function () {
            const cmd = {};
            assert.equal(getCommandWithDefaultTestDir(cmd).testDirGlob, 'test/**/*.js');
        });

    });

    describe('onlyJsTests function', function () {

        describe('all JS specs', function () {
            it('should be true', function () {
                const cmd = {
                    testDirGlob: 'fixtures/only-js'
                };
                assert(onlyJsTests(cmd));
            });

        });

        describe('all Vue specs', function () {
            it('should be false', function () {
                const cmd = {
                    testDirGlob: 'fixtures/only-vue'
                };


                assert(!onlyJsTests(cmd, __dirname));
            });

        });

        describe('Vue and JS specs', function () {
            it('should be false', function () {
                const cmd = {
                    testDirGlob: 'fixtures/only-vue'
                };


                assert(!onlyJsTests(cmd, __dirname));
            });

        });
    });

});