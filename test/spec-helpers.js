/**
 * Electron BrowserWindow stub.
 */
class BrowserWindow {
  /**
   * @param {object} [options] – browser window options
   * @param {IPC} [options.ipcMain] – electron's ipcMain reference
   */
  constructor(options = {}) {
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
