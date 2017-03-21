'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = brightsocket;

var _poolapi = require('./poolapi');

var _poolapi2 = _interopRequireDefault(_poolapi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function brightsocket(server) {
  return (0, _poolapi2.default)(server);
} /**
   * Imports source material and puts the final wrapper on it.
   */