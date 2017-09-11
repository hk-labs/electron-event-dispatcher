const {EventEmitter} = require('events');

const {BrowserWindow} = require('./spec-helpers');
const EventDispatcher = require('../lib/event-dispatcher');

describe('EventDispatcher', () => {
  /**
   * @type {EventDispatcher}
   */
  let dispatcher;
  beforeEach(() => (dispatcher = new EventDispatcher()));

  describe('#detach', () => {
    it("doesn't fail when detaching unrecognized items", () => {
      const window = new BrowserWindow();
      dispatcher.attach(window);

      const object = {};
      dispatcher.detach(object);
    });
  });

  describe('#broadcast', () => {
    it("doesn't fail when there are no windows bound", () => {
      dispatcher.broadcast('event');
    });

    it('sends a given event to the bound window', () => {
      const window = new BrowserWindow();
      dispatcher.attach(window);

      dispatcher.broadcast('event');

      expect(window.webContents.send)
        .to.have.been.calledWith('event');
    });

    it("doesn't send events to the unbound window", () => {
      const window = new BrowserWindow();
      dispatcher.attach(window);
      dispatcher.detach(window);

      dispatcher.broadcast('event');

      expect(window.webContents.send).to.have.not.been.called;
    });

    describe('when there are several windows are bound', () => {
      /**
       * @type {Array<BrowserWindow>}
       */
      let windows;

      beforeEach('setup windows', () => {
        windows = [];
        for (let i = 0; i < 3; i++) {
          windows[i] = new BrowserWindow();
        }
      });

      it('broadcasts a given event to all bound windows', () => {
        for (const window of windows) {
          dispatcher.attach(window);
        }

        dispatcher.broadcast('event');

        for (const window of windows) {
          expect(window.webContents.send)
            .to.have.been.calledWith('event');
        }
      });

      it("doesn't send events to the unbound windows", () => {
        for (const window of windows) {
          dispatcher.attach(window);
        }

        for (const window of windows) {
          dispatcher.detach(window);
        }

        dispatcher.broadcast('event');

        for (const window of windows) {
          expect(window.webContents.send).to.have.not.been.called;
        }
      });
    });

    describe('when event arguments are given', () => {
      it('sends the event with the given arguments', () => {
        const window = new BrowserWindow();
        dispatcher.attach(window);

        dispatcher.broadcast('event', 1.23, 'ABC', null, false);

        expect(window.webContents.send)
          .to.have.been.calledWith('event', 1.23, 'ABC', null, false);
      });
    });
  });

  describe('#connect', () => {
    it("doesn't allow to connect emitter handlers to the running dispatcher", () => {
      const emitter = new EventEmitter();
      const handlers = {
        event: () => {}
      };

      return dispatcher.start()
        .then(() => {
          expect(() => dispatcher.connect(emitter, handlers))
            .to.throw('connecting `emitter` handlers to a running dispatcher');
        });
    });
  });

  describe('#disconnect', () => {
    it("doesn't allow to disconnect emitter handlers from the running dispatcher", () => {
      const emitter = new EventEmitter();
      const handlers = {
        event: () => {}
      };

      dispatcher.connect(emitter, handlers);

      return dispatcher.start()
        .then(() => {
          expect(() => dispatcher.disconnect(emitter))
            .to.throw('disconnecting `emitter` handlers from a running dispatcher');
        });
    });

    it("doesn't fail when disconnecting unrecognized items", () => {
      const emitter = new EventEmitter();
      const handlers = {
        event: () => {}
      };

      dispatcher.connect(emitter, handlers);

      const object = {};
      dispatcher.disconnect(object);
    });
  });

  describe('#start', () => {
    it("enables the dispatcher's `running` flag", () => {
      expect(dispatcher.running).to.eql(false);

      return dispatcher.start()
        .then(() => {
          expect(dispatcher.running).to.eql(true);
        });
    });

    it("attaches connected emitters' event handlers", () => {
      const emitter = new EventEmitter();
      const handlers = {
        first: sinon.stub(),
        second: sinon.stub()
      };

      dispatcher.connect(emitter, handlers);

      return dispatcher.start()
        .then(() => {
          emitter.emit('first');
          emitter.emit('second');

          expect(handlers.first).to.have.been.called;
          expect(handlers.second).to.have.been.called;
        });
    });

    it("doesn't attach disconnected emitter's event handlers", () => {
      const emitter = new EventEmitter();
      const handlers = {
        first: sinon.stub(),
        second: sinon.stub()
      };

      dispatcher.connect(emitter, handlers);
      dispatcher.disconnect(emitter);

      return dispatcher.start()
        .then(() => {
          emitter.emit('first');
          expect(handlers.first).to.have.not.been.called;

          emitter.emit('second');
          expect(handlers.second).to.have.not.been.called;
        });
    });

    describe('when the dispatcher is already started', () => {
      beforeEach('stub the logger', () => {
        sinon.stub(console, 'warn');
      });

      afterEach('restore the logger', () => {
        console.warn.restore();
      });

      it('warns about that the dispatcher is already running', () => {
        return dispatcher.start()
          .then(() => dispatcher.start())
          .then(() => {
            expect(console.warn).to.have.been.calledWith(
              'the `%s` dispatcher is already running',
              'EventDispatcher'
            );
          });
      });

      it("doesn't attach connected emitters' event handlers again", () => {
        const emitter = new EventEmitter();
        const handlers = {
          event: sinon.stub()
        };

        dispatcher.connect(emitter, handlers);

        return dispatcher.start()
          .then(() => dispatcher.start())
          .then(() => {
            emitter.emit('event');
            expect(handlers.event).to.have.been.calledOnce;
          });
      });
    });
  });

  describe('#stop', () => {
    it("disables the dispatcher's `running` flag", () => {
      return dispatcher.start()
        .then(() => {
          expect(dispatcher.running).to.eql(true);
        })
        .then(() => dispatcher.stop())
        .then(() => {
          expect(dispatcher.running).to.eql(false);
        });
    });

    it("detaches connected emitters' event handlers", () => {
      const emitter = new EventEmitter();
      const handlers = {
        first: sinon.stub(),
        second: sinon.stub()
      };

      dispatcher.connect(emitter, handlers);

      return dispatcher.start()
        .then(() => dispatcher.stop())
        .then(() => {
          emitter.emit('first');
          emitter.emit('second');

          expect(handlers.first).to.have.not.been.called;
          expect(handlers.second).to.have.not.been.called;
        });
    });

    describe('when the dispatcher is not running', () => {
      beforeEach('stub the logger', () => {
        sinon.stub(console, 'warn');
      });

      afterEach('restore the logger', () => {
        console.warn.restore();
      });

      it('warns about that the dispatcher is not running', () => {
        return dispatcher.stop()
          .then(() => {
            expect(console.warn).to.have.been.calledWith(
              'unable to `#stop` the `%s`, the dispatcher is not running',
              'EventDispatcher'
            );
          });
      });
    });
  });

  describe('#restart', () => {
    beforeEach("stub dispatcher's `#start/#stop`", () => {
      sinon.stub(dispatcher, 'start').resolves();
      sinon.stub(dispatcher, 'stop').resolves();
    });

    afterEach("restore dispatcher's `#start/#stop`", () => {
      dispatcher.start.restore();
      dispatcher.stop.restore();
    });

    it('sequentially stops then starts the dispatcher', () => {
      return dispatcher.restart()
        .then(() => {
          expect(dispatcher.stop).to.have.been.called;
          expect(dispatcher.start).to.have.been.called;

          expect(dispatcher.stop)
            .to.have.been.calledBefore(dispatcher.start);
        });
    });
  });

  describe('#isRunning', () => {
    it("reflects dispatcher's running state", () => {
      return Promise.resolve()
        .then(() => expect(dispatcher.isRunning()).to.be.false)
        .then(() => dispatcher.start())
        .then(() => expect(dispatcher.isRunning()).to.be.true)
        .then(() => dispatcher.stop())
        .then(() => expect(dispatcher.isRunning()).to.be.false);
    });
  });
});
