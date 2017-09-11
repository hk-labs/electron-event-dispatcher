'use strict';

const {EventEmitter} = require('events');

/**
 * Electron's BrowserWindow stub.
 */
class BrowserWindow extends EventEmitter {
  /**
   * @param {object} [options] – browser window options
   * @param {Electron.AllElectron.ipcMain} [options.ipcMain] – ipcMain stub
   */
  constructor(options = {}) {
    super();

    this.webContents = {
      send: sinon.stub()
    };

    if (options.ipcMain) {
      const {ipcMain} = options;

      /**
       * Aka `ipcRenderer` from the `BrowserWindow` scope.
       * @type {object}
       */
      this.ipcRenderer = {
        /**
         * Used to send events from a browser window.
         * @param {string} event
         * @param {*} args
         */
        send: (event, ...args) => {
          ipcMain.emit(event, ...args, {
            sender: this.webContents
          });
        }
      };
    }
  }
}

module.exports = {
  BrowserWindow
};
