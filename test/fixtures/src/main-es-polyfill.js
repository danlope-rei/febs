// ES with polyfillable code - build should contain polyfills
// for Promise and Object.assign.

const p = new Promise((resolve, reject) => {});
const o = Object.assign({}, {a:1}, {b:2});

module.exports = {
  p,
  o
};