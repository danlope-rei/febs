// import assert from 'assert';

//import {add, sub} from './lib';

const assert = require('assert');
const add = require('../../js-only/src/lib').add;
const sub = require('../../js-only/src/lib').sub;

describe('js-only integration', function () {
	it('it should add 1 and 2', function () {
		assert.equal(add(1,2), 3)
	});
});
