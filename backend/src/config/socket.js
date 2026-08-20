/**
 * Socket.io singleton accessor
 *
 * Avoids circular dependency issues when controllers need the `io` instance
 * but can't access it through `req.app.get('io')` (e.g. inside helper functions).
 *
 * Usage:
 *   In server.js (after creating io):  require('./config/socket').setIo(io)
 *   In controllers:                    const { getIo } = require('../config/socket')
 */

let _io = null;

module.exports = {
  /**
   * Store the io instance — called once from server.js after Socket.io is initialised.
   * @param {import('socket.io').Server} io
   */
  setIo: (io) => {
    _io = io;
  },

  /**
   * Retrieve the io instance.
   * Returns null if called before setIo (e.g. during unit tests).
   * @returns {import('socket.io').Server | null}
   */
  getIo: () => _io,
};
