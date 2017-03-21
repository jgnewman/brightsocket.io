'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @module socketpool
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @exports The SocketPool class
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Adds our first, light layer on top of Socket.io to make websocket
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * interactions easier and more semantic.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Usage:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 1. Create a node server.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 2. Import and call `socketPool(server)`. This will create a ConnectionManager
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    instance. The CM makes an implicit call to `io(server)` so that you don't
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    have to mess with that whole thing.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * The ConnectionManager thinks about emitted messages in terms of "action"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * and "payload" vernacular. The action is an event name and the payload is the
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * actual content of the message. With the ConnectionManager you can...
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 1. Emit an action to all sockets.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    `<CM_INSTANCE>.emit(action, payload)` will emit your action to all
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    connections managed by this CM instance.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 2. Emit an action to a single socket.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    `<CM_INSTANCE>.emitTo(socketId, action, payload)` will emit your action
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    to the socket identified by its ID. The specified socket must exist
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    within the pool of connections managed by this CM instance.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 3. Manage new connections to socket.io.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    `<CM_INSTANCE>.onConnection(callback)` allows you to build an API for
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    a new connection to the socket pool. When executed, `callback` takes
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    as its arguments the new socket connection and the full pool of sockets.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * With an individual Connection instance you can...
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 1. Listen for actions on that connection.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    `connection.on(action, callback)` will set up an event listener using
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    socket.io and execute your callback when the specified action is detected.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 2. Emit actions on that connection.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    `connection.emit(action, payload)` will emit an action on this connection.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 3. Apply middleware that will handle all incoming messages.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    `connection.filterIncoming(middleware)` will handle all
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *    incoming messages before `on` gets to them.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

exports.default = socketpool;

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Sends a message to a single socket connected to socket.io.
 *
 * @param  {Object} pool    The socket.io connection pool.
 * @param  {String} id      The socket's ID.
 * @param  {String} event   The name of the event to emit.
 * @param  {Any}    message The serializable message to send.
 *
 * @return {undefined}
 */
function _emitTo(pool, id, event, message) {
  var socket = pool.sockets.connected[id];
  if (socket) {
    return socket.emit(event, message);
  } else {
    console.log('Cannot emit ' + event + ' to disconnected socket ' + id);
  }
}

/**
 * Executes each function in a list of asynchronous functions. Each one
 * is given an argument we call `next`. The only way to get to the next
 * function in the list is to call `next`. If you don't, the process is
 * halted.
 *
 * @param  {Array}    wares    A list of possibly asynchronous functions.
 * @param  {String}   event    The name of a socket event.
 * @param  {Any}      payload  The body of the socket message.
 * @param  {Function} callback A function to run after all middleware is executed.
 *
 * @return {undefined}
 */
function runAsyncMiddleware(wares, event, payload, callback) {
  if (wares.length) {
    var ware = wares[0];
    var restWares = wares.slice(1);
    ware(event, payload, function () {
      runAsyncMiddleware(restWares, event, payload, callback);
    });
  } else {
    callback && callback(payload);
  }
}

/**
 * @class
 *
 * Models a single websocket connection in the connection pool.
 */

var Connection = function () {

  /**
   * @constructor
   *
   * Builds the class instance.
   *
   * @param  {Object} socket A Socket.io socket object.
   * @param  {Object} pool   The Socket.io pool.
   *
   * @return {undefined}
   */
  function Connection(socket, pool) {
    _classCallCheck(this, Connection);

    this.socket = socket;
    this.id = socket.id;
    this.pool = pool;
    this.incomingFilters = [];
  }

  /**
   * Create an event handler for a named event.
   *
   * @param  {String}   event The event name.
   * @param  {Function} fn    The handler.
   *
   * @return The result of calling `socket.on`.
   */


  _createClass(Connection, [{
    key: 'on',
    value: function on(event, fn) {
      var _this = this;

      return this.socket.on(event, function (payload) {
        runAsyncMiddleware(_this.incomingFilters, event, payload, fn);
      });
    }

    /**
     * Trigger an event only on this particular connection.
     *
     * @param  {String} event   The event name.
     * @param  {Any}    message The data to send with the event.
     *
     * @return The result of calling Socket.io's `emit` method.
     */

  }, {
    key: 'emit',
    value: function emit(event, message) {
      return _emitTo(this.pool, this.id, event, message);
    }

    /**
     * Apply middleware to incoming messages.
     *
     * @param  {Function} middleware  A function to be executed BEFORE
     *                                normal event listener functions.
     */

  }, {
    key: 'filterIncoming',
    value: function filterIncoming(middleware) {
      return this.incomingFilters.push(middleware);
    }
  }]);

  return Connection;
}();

/**
 * @class
 *
 * Creates an interface for managing connections at a high level.
 */


var ConnectionManager = function () {

  /**
   * Builds the class instance. Also sets up a request handler on the
   * provided server to send back the client version of the library when
   * the client requests `/socket.pool/socket.pool.js`.
   *
   * @param  {Object} server An Express server instance.
   *
   * @return {undefined}
   */
  function ConnectionManager(server) {
    _classCallCheck(this, ConnectionManager);

    this.server = server;
    this.pool = (0, _socket2.default)(server);
  }

  /**
   * When there is a new connection opened, run the provided function
   * in order to build the API for that connection. The provided
   * function will be handed references to both the single connection
   * as well as the overall pool.
   *
   * @param  {Function} apiFn Builds the API for the connection.
   *
   * @return The result of creating a Socket.io connection handler.
   */


  _createClass(ConnectionManager, [{
    key: 'onConnection',
    value: function onConnection(apiFn) {
      var _this2 = this;

      return this.pool.on('connection', function (socket) {
        var connection = new Connection(socket, _this2.pool);
        apiFn(connection, _this2.pool);
      });
    }

    /**
     * Send a message to a single connection in the pool by ID.
     *
     * @param  {String} id      The ID of the connection to send a message to.
     * @param  {String} event   The name of the event to send.
     * @param  {Any}    message The message associated with the event.
     *
     * @return The result of calling Socket.io's `emit` method.
     */

  }, {
    key: 'emitTo',
    value: function emitTo(id, event, message) {
      return _emitTo(this.pool, id, event, message);
    }

    /**
     * Send a message to all connections in the pool.
     *
     * @param  {String} event   The name of the event to send.
     * @param  {Any}    message The message associated with the event.
     *
     * @return The result of calling Socket.io's `emit` method.
     */

  }, {
    key: 'emit',
    value: function emit(event, message) {
      return this.pool.emit(event, message);
    }
  }]);

  return ConnectionManager;
}();

/**
 * Creates a new socket pool and spins up an
 * instance of socket.io with the provided server.
 *
 * @param  {Server} server An http server.
 *
 * @return {SocketPool}
 */


function socketpool(server) {
  return new ConnectionManager(server);
}