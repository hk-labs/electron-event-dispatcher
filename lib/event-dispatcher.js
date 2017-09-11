'use strict';

/**
 * Event dispatcher API.
 */
class EventDispatcher {
  constructor() {
    /**
     * Attached windows' references.
     * @private
     * @type {Array<BrowserWindow>}
     */
    this.windows = [];

    /**
     * Connected event emitters.
     * @private
     * @type {Array<EventEmitter>}
     */
    this.connectors = [];

    /**
     * Dispatcher "is running" flag.
     * @private
     * @type {boolean}
     */
    this.running = false;
  }

  /**
   * Attach a given `window` to the event dispatcher.
   * Attached windows will receive all {#broadcast}ing events.
   *
   * @param {BrowserWindow} window
   * @todo add ability to specify exact events to subscribe.
   */
  attach(window) {
    this.windows.push(window);

    window.on('closed', () => this.detach(window));
  }

  /**
   * Detach a given `window` from the event dispatcher.
   *
   * Technically, removes a given `window` reference from
   * the attached windows collection to give'em be garbage collected.
   *
   * Note that windows are detached automatically on `closed`.
   *
   * @param {BrowserWindow} window
   */
  detach(window) {
    const index = this.windows.indexOf(window);
    if (index !== -1) {
      this.windows.splice(index, 1);
    }
  }

  /**
   * Broadcast an event to all attached windows.
   *
   * @param {string} event
   * @param {*} [args...]
   */
  broadcast(event, ...args) {
    for (const window of this.windows) {
      window.webContents.send(event, ...args);
    }
  }

  /**
   * Connect event emitter handlers in the context of this dispatcher.
   *
   * @param {EventEmitter} emitter
   * @param {object<string, function>} handlers
   */
  connect(emitter, handlers) {
    if (this.running) {
      throw new Error('connecting `emitter` handlers to a running dispatcher');
    }

    this.connectors.push({ emitter, handlers });
  }

  /**
   * Disconnect event emitter handlers from the dispatcher.
   *
   * @param {EventEmitter} emitter
   */
  disconnect(emitter) {
    if (this.running) {
      throw new Error('disconnecting `emitter` handlers from a running dispatcher');
    }

    const index = this.connectors
      .findIndex(connector => (connector.emitter === emitter));

    if (index !== -1) {
      this.connectors.splice(index, 1);
    }
  }

  /**
   * Start the dispatcher.
   * Override this method in sub-classes to start driver/connect/etc...
   *
   * @return {Promise}
   */
  start() {
    if (this.running) {
      console.warn('the `%s` dispatcher is already running', this.constructor.name); // >>>
      return Promise.resolve();
    }

    for (const connector of this.connectors) {
      const {emitter, handlers} = connector;
      for (const event of Object.keys(handlers)) {
        emitter.on(event, handlers[event]);
      }
    }

    this.running = true;

    return Promise.resolve();
  }

  /**
   * Stop the dispatcher.
   * Override this method in sub-classes to stop driver/disconnect/etc...
   *
   * @return {Promise}
   */
  stop() {
    if (!this.running) {
      console.warn( // >>>
        'unable to `#stop` the `%s`, the dispatcher is not running',
        this.constructor.name);

      return Promise.resolve();
    }

    for (const connector of this.connectors) {
      const {emitter, handlers} = connector;
      for (const event of Object.keys(handlers)) {
        emitter.removeListener(event, handlers[event]);
      }
    }

    this.running = false;

    return Promise.resolve();
  }

  /**
   * Sequentially stop then start the dispatcher.
   *
   * @return {Promise}
   */
  restart() {
    return this.stop()
      .then(() => this.start());
  }

  /**
   * Get service `running` state.
   *
   * @return {boolean}
   */
  isRunning() {
    return this.running;
  }
}

module.exports = EventDispatcher;
