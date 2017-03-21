'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @module poolapi
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @exports The PoolAPI class
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Adds our second, light layer on top of Socket.io designed to help users
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * build APIs on top of a socketpool.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Usage:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 1. Import and call the `poolapi` function.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    `const api = poolapi(socketio_compatible_server)`
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 2. Define APIs for different connection types
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    ```
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    api.identify('MY_TYPE', (connection, identity, webserver) => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *      connection.on('SOME_ACTION', payload => ... )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    })
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    ```
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Taking front-end into consideration, a front-end user will need to connect
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * to socket.io then send the 'IDENTIFY' action where the payload is an object
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * with a `type` key. The value for this key should match the first argument
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * passed to `api.identify`. This will allow the identify callback to be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * executed for this connection.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

exports.default = poolapi;

var _socketpool = require('./socketpool');

var _socketpool2 = _interopRequireDefault(_socketpool);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PoolAPI = function () {

  /**
   * Builds the class.
   */
  function PoolAPI(server) {
    _classCallCheck(this, PoolAPI);

    this.pool = (0, _socketpool2.default)(server);
    this.server = server;
  }

  /**
   * Sets up a listener for a new connection. When a connection occurs,
   * sets up a listener on that connection for the IDENTIFY action. Once
   * a connection sends that action, the promise will resolve with that
   * connection, the identity payload, and the webserver, thus allowing you to
   * hook an api up to that connection and even authenticate it if you want.
   */


  _createClass(PoolAPI, [{
    key: 'identify',
    value: function identify(type) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.pool.onConnection(function (connection, pool) {
          connection.on('IDENTIFY', function (identity) {
            if (type === identity.type) {
              resolve(connection, identity, _this.server);
            }
          });
        });
      });
    }
  }]);

  return PoolAPI;
}();

/**
 * Creates a new api builder containing an easily-managed
 * socket pool.
 *
 * @param  {Server} server An http server.
 *
 * @return {PoolAPI}
 */


function poolapi(server) {
  return new PoolAPI(server);
}