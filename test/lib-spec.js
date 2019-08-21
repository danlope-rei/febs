/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback, func-names */

const assert = require('assert');
const lib = require('../lib');

describe('FEBS Lib Tests', function () {
  describe('checkVersion', function () {
    const testCases = [
      {
        currentVersion: 'v8.0.0',
        minVersion: '9.0.0',
        expected: false,
        message: 'Major min sad',
      },
      {
        currentVersion: 'v8.0.0',
        minVersion: '7.0.0',
        expected: true,
        message: 'Major min happy',
      },
      {
        currentVersion: 'v8.1.0',
        minVersion: '8.0.0',
        expected: true,
        message: 'Minor min happy',
      },
      {
        currentVersion: 'v8.1.0',
        minVersion: '8.2.0',
        expected: false,
        message: 'Minor min sad',
      },
      {
        currentVersion: 'v8.1.1',
        minVersion: '8.1.0',
        expected: true,
        message: 'Patch min happy',
      },
      {
        currentVersion: 'v8.1.0',
        minVersion: '8.1.1',
        expected: false,
        message: 'Patch min sad',
      },
      {
        currentVersion: 'v8.0.0',
        minVersion: '8.0.0',
        expected: true,
        message: 'Equal happy',
      },
    ];

    it('should check current node version >= minimum node version', function () {
      testCases.forEach((testCase) => {
        assert.strictEqual(
          lib.checkVersion(testCase.currentVersion, testCase.minVersion),
          testCase.expected,
          testCase.message
        );
      });
    });
  });
});
