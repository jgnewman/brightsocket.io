/**
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
 */

import io from 'socket.io';

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
function emitTo(pool, id, event, message) {
  const socket = pool.sockets.connected[id];
  if (socket) {
    return socket.emit(event, message);
  } else {
    console.log(`Cannot emit ${event} to disconnected socket ${id}`);
  }
}

/**
 * @class
 *
 * Models a single websocket connection in the connection pool.
 */
class Connection {

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
  constructor(socket, pool) {
    this.socket = socket;
    this.id = socket.id;
    this.pool = pool;
  }

  /**
   * Create an event handler for a named event.
   *
   * @param  {String}   event The event name.
   * @param  {Function} fn    The handler.
   *
   * @return The result of calling `socket.on`.
   */
  on(event, fn) {
    return this.socket.on(event, fn);
  }

  /**
   * Trigger an event only on this particular connection.
   *
   * @param  {String} event   The event name.
   * @param  {Any}    message The data to send with the event.
   *
   * @return The result of calling Socket.io's `emit` method.
   */
  emit(event, message) {
    return emitTo(this.pool, this.id, event, message);
  }
}


/**
 * @class
 *
 * Creates an interface for managing connections at a high level.
 */
class ConnectionManager {

  /**
   * Builds the class instance. Also sets up a request handler on the
   * provided server to send back the client version of the library when
   * the client requests `/socket.pool/socket.pool.js`.
   *
   * @param  {Object} server An Express server instance.
   *
   * @return {undefined}
   */
  constructor(server) {
    this.server = server;
    this.pool = io(server);
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
  onConnection(apiFn) {
    return this.pool.on('connection', socket => {
      const connection = new Connection(socket, this.pool);
      apiFn(connection, this.pool);
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
  emitTo(id, event, message) {
    return emitTo(this.pool, id, event, message);
  }

  /**
   * Send a message to all connections in the pool.
   *
   * @param  {String} event   The name of the event to send.
   * @param  {Any}    message The message associated with the event.
   *
   * @return The result of calling Socket.io's `emit` method.
   */
  emit(event, message) {
    return this.pool.emit(event, message);
  }
}

/**
 * Creates a new socket pool and spins up an
 * instance of socket.io with the provided server.
 *
 * @param  {Server} server An http server.
 *
 * @return {SocketPool}
 */
export default function socketpool(server) {
  return new ConnectionManager(server);
}
