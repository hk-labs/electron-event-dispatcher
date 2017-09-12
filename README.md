# Electron Event Dispatcher

[![Build Status](https://travis-ci.org/hk-labs/electron-event-dispatcher.svg?branch=master)](https://travis-ci.org/hk-labs/electron-event-dispatcher)
[![npm version](https://badge.fury.io/js/electron-event-dispatcher.svg)](https://badge.fury.io/js/electron-event-dispatcher)
[![dependencies Status](https://david-dm.org/hk-labs/electron-event-dispatcher/status.svg)](https://david-dm.org/hk-labs/electron-event-dispatcher)

Helps you to organize communication between `BrowserWindow`s, main/renderer IPCs,
Sockets or any other `EventEmitter`s in your [Electron](https://electron.atom.io/) applications.


## Installation

NPM:

```bash
$ npm install electron-event-dispatcher
```

Yarn:

```bash
$ yarn add electron-event-dispatcher
```


## Usage

_lib/device-events-dispatcher.js_

```js
const EventDispatcher = require('electron-event-dispatcher');

class DeviceEventsDispatcher extends EventDispatcher {
  constructor(driver, ipcMain) {
    super();
    
    // driver event handlers
    this.connect(driver, {
      connected: () => {
        // send `device-connected` event to all bound windows
        this.broadcast('device-connected');
      },
      disconnected: () => {
        // send `device-disconnected` event to all bound windows
        this.broadcast('device-disconnected');
      },
      data: (data) => {
        // send device data to all bound windows
        this.broadcast('device-data-received', data);
      }
    });
    
    // windows' (renderer) event handlers
    this.connect(ipcMain, {
      'get-device-state': (event) => {
        // respond to the requesting browser window
        event.sender.send('device-state', {
          connected: driver.connected || false
        });
      }
    });
  }
  
  /**
   * Override start/stop if you want to add some pre/post hooks.
   * @return {Promise}
   */
  start() {
    // add some pre-start logic...
    
    return super.start()
      .then(() => {
        // add some post-start logic...
      });
  }
  
  /**
   * Override start/stop if you want to add some pre/post hooks.
   * @return {Promise}
   */
  stop() {
    // add some pre-stop logic...
    
    return super.stop()
        .then(() => {
          // add some post-stop logic...
        });
    }
}

module.exports = DeviceEventsDispatcher;
```

_app/main.js_

```js
const {app, BrowserWindow, ipcMain} = require('electron');
const DeviceEventsDispatcher = require('../lib/device-events-dispatcher');
const DeviceDriver = require('../lib/device-driver'); // an example event emitter

let mainWindow;
let settingsWindow;
let deviceEventsDispatcher;

function createMainWindow() {
  mainWindow = new BrowserWindow({ ... });
  mainWindow.loadUrl('../main.html');
  
  deviceEventsDispatcher.attach(mainWindow);
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({ ... });
  settingsWindow.loadUrl('../settings.html');
    
  deviceEventsDispatcher.attach(settingsWindow);
    
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

app.on('ready', () => {
  const driver = new DeviceDriver();
  deviceEventsDispatcher = new DeviceEventsDispatcher(driver, ipcMain);
  
  deviceEventsDispatcher.start()
    .then(() => createMainWindow());
});

app.on('window-all-closed', () => {
  deviceEventsDispatcher.stop()
    .then(() => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
});

app.on('activate', () => {
  deviceEventsDispatcher.start()
    .then(() => createMainWindow());
});
```


## API

### Class: EventDispatcher

An instance of `EventDispatcher` is a unit that represents an event hub between
electron's `BrowserWindow`s and any `EventEmitter`s (electron's ipc, tcp/web sockets, device drivers, etc.).


#### `#attach(window)`
Attach a `BrowserWindow` instance to the event dispatcher.
Attached windows will receive all `#broadcast()`ing events.

| Param  | Type            | Description                          |
| ------ | --------------- | ------------------------------------ |
| window | `BrowserWindow` | Electron's `BrowserWindow` instance. |


#### `#detach(window)`
Detach a given `window` from the event dispatcher.

_Technically, removes a given `window` reference from
the attached windows collection to give'em be garbage collected._

> Note that windows are detached automatically on `closed`.

| Param  | Type            | Description                          |
| ------ | --------------- | ------------------------------------ |
| window | `BrowserWindow` | Electron's `BrowserWindow` instance. |

#### `#broadcast(event, [...args])`
Broadcast an event to all attached windows.

| Param     | Type           | Description                            |
| --------- | -------------- | -------------------------------------- |
| event     | `String`       | The name of the event to broadcast.    |
| [...args] | `EventEmitter` | Any number of event-related arguments. |

#### `#connect(emitter, handlers)`
Connect event emitter handlers in the context of this dispatcher.

| Param    | Type                       | Description                |
| -------- | -------------------------- | -------------------------- |
| emitter  | `EventEmitter`             | An event emitter instance. |
| handlers | `Object<String, Function>` | An `event` => `function` object map, where `event` is a name of event to handle and `function` is a handler of this event. |

#### `#disconnect(emitter)`
Disconnect event emitter handlers from this dispatcher.

| Param   | Type           | Description                |
| ------- | -------------- | -------------------------- |
| emitter | `EventEmitter` | An event emitter instance. |

#### `#start()` ⇒ `Promise`
Start the event dispatcher. Binds all `#connect()`ed event emitters' handlers.

#### `#stop()` ⇒ `Promise`
Stop the event dispatcher. Unbinds all `#connect()`ed event emitters' handlers. 

#### `#restart()` ⇒ `Promise`
Restart the event dispatcher.

#### `#isRunning` ⇒ `boolean`
Returns `true` if the event dispatcher is running.


## Contributing

Feel free to dive in! [Open an issue](https://github.com/hk-labs/electron-event-dispatcher/issues/new) or submit PRs.


## Running tests

In your terminal run:

```bash
$ npm test
```

or

```bash
$ yarn test
```


## License

Licensed under [MIT](LICENSE) © 2017 Holy Krab Labs
