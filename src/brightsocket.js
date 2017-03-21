/**
 * Imports source material and puts the final wrapper on it.
 */

import poolapi from './poolapi';

export default function brightsocket(server) {
  return poolapi(server);
}
