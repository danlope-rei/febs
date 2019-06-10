// Source for test case around babel-loader's
// include section.  Should transpile @rei namespaced module
// and not transpile some-module.

const { add3 } = require('@rei/test');
const { add4 } = require('some-module');

module.exports = {
  add3,
  add4,
};
