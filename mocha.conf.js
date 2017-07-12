// set `NODE_ENV` to 'test'
process.env.NODE_ENV = 'test';

const chai = require('chai');

// globalize chai.expect
global.expect = chai.expect;

// globalize sinon
global.sinon = require('sinon');

// initialize chai plugins
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
