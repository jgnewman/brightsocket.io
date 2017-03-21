/**
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

import socketpool from './socketpool';

class PoolAPI {

  /**
   * Builds the class.
   */
  constructor(server) {
    this.pool = socketpool(server);
    this.server = server;
  }

  /**
   * Sets up a listener for a new connection. When a connection occurs,
   * sets up a listener on that connection for the IDENTIFY action. Once
   * a connection sends that action, the promise will resolve with that
   * connection, the identity payload, and the webserver, thus allowing you to
   * hook an api up to that connection and even authenticate it if you want.
   */
  identify(type, callback) {
    this.pool.onConnection((connection, pool) => {
      connection.on('IDENTIFY', identity => {
        if (type === identity.type) {
          callback && callback(connection, identity, this.server);
        }
      });
    });
  }

}

/**
 * Creates a new api builder containing an easily-managed
 * socket pool.
 *
 * @param  {Server} server An http server.
 *
 * @return {PoolAPI}
 */
export default function poolapi(server) {
  return new PoolAPI(server);
}
