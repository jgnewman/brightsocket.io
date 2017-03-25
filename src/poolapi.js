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

/**
 * Runs a series of callbacks for a new connection.
 *
 * @param  {Object} settings - All the values we'll need to run the callbacks.
 *
 * @return {undefined}
 */
function runExtensions(settings) {
  const { extensions, connectionTypes, connection, userPackage, server } = settings;

  // For every extension the user listed...
  extensions.forEach(extension => {

    // Find the callbacks associated with that extension.
    const callbacks = connectionTypes[extension];

    // If there aren't any, we're trying to extend something that hasn't
    // been defined yet.
    if (!callbacks) {
      throw new Error(`Can not extend type ${extension} because it does not exist.`);

    // Otherwise, we can call each one.
    } else {
      callbacks.forEach(callback => callback(connection, userPackage, server));
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
  const userPackage = {};
  Object.keys(identity).forEach(key => {
    if (key.indexOf('BRIGHTSOCKET:') !== 0) {
      userPackage[key] = identity[key];
    }
  });
  return userPackage;
}


class PoolAPI {

  /**
   * Builds the class.
   */
  constructor(server) {
    this.pool = socketpool(server);
    this.server = server;
    this.connectionTypes = {};
  }

  /**
   * Sets up a listener for a new connection. When a connection occurs,
   * sets up a listener on that connection for the IDENTIFY action. Once
   * a connection sends that action, the promise will resolve with that
   * connection, the identity payload, and the webserver, thus allowing you to
   * hook an api up to that connection and even authenticate it if you want.
   */
  identify(expectedType, extensions, callback) {

    // Determine whether we have extension types.
    if (!callback) {
      callback = extensions;
      extensions = null;
    }

    // Make sure our connectionTypes object registry exists then
    // register the callback for that connection type.
    if (callback) {
      this.connectionTypes[expectedType] = this.connectionTypes[expectedType] || [];
      this.connectionTypes[expectedType].push(callback);
    }

    // When a new connection comes in...
    this.pool.connect((connection, pool) => {

      // Set up a listener for the internal IDENTIFY action.
      connection.receive('BRIGHTSOCKET:IDENTIFY', identity => {

        // Assess the usertype being identified.
        const userType = identity['BRIGHTSOCKET:USERTYPE'];

        // If the usertype matches the expected identified type...
        if (expectedType === userType) {

          // Loop over the identity package and filter out all
          // internal keys.
          const userPackage = cleanIdentity(identity);

          // Run all extension callbacks if they exist
          if (extensions) {
            runExtensions({
              extensions: extensions,
              connectionTypes: this.connectionTypes,
              connection: connection,
              userPackage: userPackage,
              server: this.server
            });
          }

          // Then run the callback
          callback && callback(connection, userPackage, this.server);
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
