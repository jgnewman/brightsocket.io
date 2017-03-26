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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 2. Define APIs for different connection channels
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    ```
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    api.identify('MY_CHANNEL', (connection, identity, webserver) => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *      connection.on('SOME_ACTION', payload => ... )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    })
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    ```
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

exports.default = poolapi;

var _socketpool = require('./socketpool');

var _socketpool2 = _interopRequireDefault(_socketpool);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Runs a series of callbacks for a new connection.
 *
 * @param  {Object} settings - All the values we'll need to run the callbacks.
 *
 * @return {undefined}
 */
function runExtensions(settings) {
  var extensions = settings.extensions,
      channels = settings.channels,
      connection = settings.connection,
      userPackage = settings.userPackage,
      server = settings.server;

  // For every extension the user listed...

  extensions.forEach(function (extension) {

    // Find the callbacks associated with that extension.
    var callbacks = channels[extension];

    // If there aren't any, we're trying to extend something that hasn't
    // been defined yet.
    if (!callbacks) {
      throw new Error('Can not extend channel ' + extension + ' because it does not exist.');

      // Otherwise, we can call each one.
    } else {
      callbacks.forEach(function (callback) {
        return callback(connection, userPackage, server);
      });
    }
  });
}

/**
 * Takes an incoming identity package and strips out keys
 * that were inserted by Brightsocket.
 *
 * @param  {Object} identity  - Came in from the IDENTIFY action.
 *
 * @return {Object} The clean object.
 */
function cleanIdentity(identity) {
  var userPackage = {};
  Object.keys(identity).forEach(function (key) {
    if (key.indexOf('BRIGHTSOCKET:') !== 0) {
      userPackage[key] = identity[key];
    }
  });
  return userPackage;
}

var PoolAPI = function () {

  /**
   * Builds the class.
   */
  function PoolAPI(server) {
    _classCallCheck(this, PoolAPI);

    this.pool = (0, _socketpool2.default)(server);
    this.server = server;
    this.channels = {};
  }

  /**
   * Sets up a listener for a new connection. When a connection occurs,
   * sets up a listener on that connection for the IDENTIFY action. Once
   * a connection sends that action, the promise will resolve with that
   * connection, the identity payload, and the webserver, thus allowing you to
   * hook an api up to that connection and even authenticate it if you want.
   */


  _createClass(PoolAPI, [{
    key: 'connect',
    value: function connect(channel, extensions, callback) {
      var _this = this;

      // Determine whether we have extension channels.
      if (!callback) {
        callback = extensions;
        extensions = null;
      }

      // Make sure our channels object registry exists then
      // register the callback for that connection channel.
      if (callback) {
        this.channels[channel] = this.channels[channel] || [];
        this.channels[channel].push(callback);
      }

      // When a new connection comes in...
      this.pool.onconnect(function (connection, pool) {

        // Set up a listener for the internal IDENTIFY action.
        connection.receive('BRIGHTSOCKET:IDENTIFY', function (identity) {

          // Assess the userChannel being identified.
          var userChannel = identity['BRIGHTSOCKET:CHANNEL'];

          // If the user channel matches the expected identified channel...
          if (channel === userChannel) {

            // Finish the identification handshake with the client.
            // Have to do this before setting up the API functions for
            // race condtion purposes.
            connection.send('BRIGHTSOCKET:IDENTIFIED');

            // Loop over the identity package and filter out all
            // internal keys.
            var userPackage = cleanIdentity(identity);

            // Run all extension callbacks if they exist
            if (extensions) {
              runExtensions({
                extensions: extensions,
                channels: _this.channels,
                connection: connection,
                userPackage: userPackage,
                server: _this.server
              });
            }

            // Then run the callback
            callback && callback(connection, userPackage, _this.server);
          }
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