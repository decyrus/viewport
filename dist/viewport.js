(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.viewport = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * Module dependencies.
 */
var Jvent = require('jvent');
var decouple = require('decouple');
var orientation = require('o9n').orientation;

/**
 * Scope variables
 */
var win = window;
var doc = win.document;
var docEl = doc.documentElement;

/**
 * Viewport class
 */
function Viewport() {
  this.calculateDeviceDimensions();
  this.refresh();
  decouple(window, 'scroll', this.eventHandler.bind(this));
  decouple(window, 'resize', this.eventHandler.bind(this));
  return this;
}

/**
 * Inherit from an Event Emitter
 */
Viewport.prototype = new Jvent();

/**
 * Event handler for resize and scroll events.
 */
Viewport.prototype.eventHandler = function eventHandler(eve) {
  // // Updates viewport
  this.refresh();
  // // Emits the current event
  this.emit(eve.type);
};

/**
 * Updates the viewport dimension, viewport positions and orientation.
 */
Viewport.prototype.refresh = function refresh() {
  this.calculateDimensions();
  this.calculateScroll();
  this.calculateOffset();
  this.calculateOrientation();
  return this;
};

/**
 * Calculates device size.
 * The size is static and does not change when the page is resized.
 * Returns an object with size of device (`width` and `height`).
 */
Viewport.prototype.calculateDeviceDimensions = function calculateDeviceDimensions() {
  this.device = {};
  this.device.height = win.screen.height;
  this.device.width = win.screen.width;
  this.device.orientation = orientation.type;
  return this;
};

/**
 * Calculates/updates the dimensions (`width` and `height`) of viewport (in pixels).
 */
Viewport.prototype.calculateDimensions = function calculateDimensions() {
  this.height = docEl.clientHeight;
  this.width = docEl.clientWidth;
  return this;
};

/**
 * Calculates/updates the scroll positions (`scrollY` and `scrollX`) of viewport.
 */
Viewport.prototype.calculateScroll = function calculateScroll() {
  var cachedTop = this.scrollY;
  var cachedBottom = this.height + cachedTop;
  var bottom;

  this.scrollY = win.pageYOffset;
  this.scrollX = win.pageXOffset;
  bottom = this.height + this.scrollY;

  if (cachedTop !== this.scrollY && this.scrollY === 0) {
    this.emit('top');
  } else if (cachedBottom !== bottom && bottom >= doc.body.scrollHeight) {
    this.emit('bottom');
  }
  return this;
};

/**
 * Calculates/updates the viewport position.
 */
Viewport.prototype.calculateOffset = function calculateOffset() {
  this.top = this.scrollY;
  this.right = this.scrollX + this.width;
  this.bottom = this.scrollY + this.height;
  this.left = this.scrollX;
  return this;
};

/**
 * Calculates/updates the device `orientation`.
 * Returns the device orientation: `portrait-primary`, `portrait-secondary`, `landscape-primary`, `landscape-secondary`.
 */
Viewport.prototype.calculateOrientation = function calculateOrientation() {
  this.device.orientation = orientation.type;
  return this;
};

/**
 * Calculate if an element is completely located in the viewport. Returns boolean.
 */
Viewport.prototype.inViewport = function inViewport(el) {
  var r = el.getBoundingClientRect();
  return (r.top >= 0) && (r.right <= this.width)
      && (r.bottom <= this.height) && (r.left >= 0);
};

/**
 * Calculates if an element is visible in the viewport. Returns boolean.
 */
Viewport.prototype.isVisible = function isVisible(el) {
  var r = el.getBoundingClientRect();
  return (r.bottom >= 0 && r.top <= this.height);
};

/**
 * Expose Viewport instance
 */
module.exports = new Viewport();

},{"decouple":2,"jvent":3,"o9n":4}],2:[function(require,module,exports){
'use strict';

var requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
}().bind(window));

function decouple(node, event, fn) {
  var eve,
      tracking = false;

  function captureEvent(e) {
    eve = e;
    track();
  }

  function track() {
    if (!tracking) {
      requestAnimFrame(update);
      tracking = true;
    }
  }

  function update() {
    fn.call(node, eve);
    tracking = false;
  }

  node.addEventListener(event, captureEvent, false);

  return captureEvent;
}

/**
 * Expose decouple
 */
module.exports = decouple;

},{}],3:[function(require,module,exports){
'use strict';

function Jvent() {}

/**
 * Adds a listener to the collection for a specified event.
 * @public
 * @function
 * @name Jvent#on
 * @param {string} event Event name.
 * @param {function} listener Listener function.
 * @example
 * // Will add a event listener to the "ready" event
 * var startDoingStuff = function (event, param1, param2, ...) {
 *   // Some code here!
 * };
 *
 * me.on("ready", startDoingStuff);
 */
Jvent.prototype.on = function(event, listener) {
  this._collection = this._collection || {};
  this._collection[event] = this._collection[event] || [];
  this._collection[event].push(listener);
  return this;
};

/**
 * Adds a one time listener to the collection for a specified event. It will execute only once.
 * @public
 * @function
 * @name Jvent#once
 * @param {string} event Event name.
 * @param {function} listener Listener function.
 * @returns itself
 * @example
 * // Will add a event handler to the "contentLoad" event once
 * me.once("contentLoad", startDoingStuff);
 */
Jvent.prototype.once = function (event, listener) {
  var that = this;

  function fn() {
    that.off(event, fn);
    listener.apply(this, arguments);
  }

  fn.listener = listener;

  this.on(event, fn);

  return this;
};

/**
 * Removes a listener from the collection for a specified event.
 * @public
 * @function
 * @name Jvent#off
 * @param {string} event Event name.
 * @param {function} listener Listener function.
 * @returns itself
 * @example
 * // Will remove event handler to the "ready" event
 * var startDoingStuff = function () {
 *   // Some code here!
 * };
 *
 * me.off("ready", startDoingStuff);
 */
Jvent.prototype.off = function (event, listener) {

  var listeners = this._collection && this._collection[event],
      j = 0;

  if (listeners !== undefined) {
    for (j; j < listeners.length; j += 1) {
      if (listeners[j] === listener || listeners[j].listener === listener) {
        listeners.splice(j, 1);
        break;
      }
    }

    if (listeners.length === 0) {
      this.removeAllListeners(event);
    }
  }

  return this;
};

/**
 * Removes all listeners from the collection for a specified event.
 * @public
 * @function
 * @name Jvent#removeAllListeners
 * @param {string} event Event name.
 * @returns itself
 * @example
 * me.removeAllListeners("ready");
 */
Jvent.prototype.removeAllListeners = function (event) {
  this._collection = this._collection || {};
  delete this._collection[event];
  return this;
};

/**
 * Returns all listeners from the collection for a specified event.
 * @public
 * @function
 * @name Jvent#listeners
 * @param {string} event Event name.
 * @returns Array
 * @example
 * me.listeners("ready");
 */
Jvent.prototype.listeners = function (event) {
  this._collection = this._collection || {};
  return this._collection[event];
};

/**
 * Execute each item in the listener collection in order with the specified data.
 * @name Jvent#emit
 * @public
 * @protected
 * @param {string} event The name of the event you want to emit.
 * @param {...object} var_args Data to pass to the listeners.
 * @example
 * // Will emit the "ready" event with "param1" and "param2" as arguments.
 * me.emit("ready", "param1", "param2");
 */
Jvent.prototype.emit = function () {
  if (this._collection === undefined) {
    return this;
  }

  var args = [].slice.call(arguments, 0), // converted to array
      event = args.shift(),
      listeners = this._collection[event],
      i = 0,
      len;

  if (listeners) {
    listeners = listeners.slice(0);
    len = listeners.length;
    for (i; i < len; i += 1) {
      listeners[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Expose Jvent
 */
module.exports = Jvent;

},{}],4:[function(require,module,exports){
'use strict';

if (typeof window != 'object') {
  throw new Error('Oh no! o9n needs to run in a browser');
}

var screen = window.screen;
var Promise = window.Promise;

var orientation;

// W3C spec implementation
if (typeof window.ScreenOrientation === 'function' &&
  screen.orientation instanceof ScreenOrientation &&
  typeof screen.orientation.addEventListener == 'function' &&
  screen.orientation.onchange === null &&
  typeof screen.orientation.type === 'string') {
  orientation = screen.orientation;
} else {
  orientation = createOrientation();
}

module.exports = {
  orientation: orientation,
  install: function install () {
    if (typeof window.ScreenOrientation === 'function' &&
      screen.orientation instanceof ScreenOrientation) {
      return screen.orientation;
    }
    window.screen.orientation = orientation;
    return orientation;
  }
};

function createOrientation () {
  var orientationMap = {
    '90': 'landscape-primary',
    '-90': 'landscape-secondary',
    '0': 'portrait-primary',
    '180': 'portrait-secondary'
  };

  var found = findDelegate();

  function ScreenOrientation() {}
  ScreenOrientation.prototype.addEventListener = delegate('addEventListener', found.delegate, found.event);
  ScreenOrientation.prototype.dispatchEvent = delegate('dispatchEvent', found.delegate, found.event);
  ScreenOrientation.prototype.removeEventListener = delegate('removeEventListener', found.delegate, found.event);
  ScreenOrientation.prototype.lock = getLock();
  ScreenOrientation.prototype.unlock = getUnlock();

  var or = new ScreenOrientation();

  Object.defineProperties(or, {
    onchange: {
      get: function () {
        return found.delegate['on' + found.event] || null;
      },
      set: function (cb) {
        found.delegate['on' + found.event] = wrapCallback(cb);
      }
    },
    type: {
      get: function () {
        return screen.msOrientation || screen.mozOrientation ||
          orientationMap[window.orientation + ''] ||
          (getMql().matches ? 'landscape-primary' : 'portrait-primary');
      }
    },
    angle: {
      value: 0
    }
  });

  return or;
}

function delegate (fnName, delegateContext, eventName) {
  return function delegated () {
    var args = Array.prototype.slice.call(arguments);
    var actualEvent = args[0].type ? args[0].type : args[0];
    if (actualEvent !== 'change') {
      return;
    }
    if (args[0].type) {
      args[0] = getOrientationChangeEvent(eventName, args[0]);
    } else {
      args[0] = eventName;
    }
    var wrapped = wrapCallback(args[1]);
    if (fnName === 'addEventListener') {
      addTrackedListener(args[1], wrapped);
    }
    if (fnName === 'removeEventListener') {
      removeTrackedListener(args[1]);
    }
    args[1] = wrapped;
    return delegateContext[fnName].apply(delegateContext, args);
  };
}

var trackedListeners = [];
var originalListeners = [];

function addTrackedListener(original, wrapped) {
  var idx = originalListeners.indexOf(original);
  if (idx > -1) {
    trackedListeners[idx] = wrapped;
  } else {
    originalListeners.push(original);
    trackedListeners.push(wrapped);
  }
}

function removeTrackedListener(original) {
  var idx2 = originalListeners.indexOf(original);
  if (idx2 > -1) {
    originalListeners.splice(idx2, 1);
    trackedListeners.splice(idx2, 1);
  }
}

function wrapCallback(cb) {
  var idx = originalListeners.indexOf(cb);
  if (idx > -1) {
    return trackedListeners[idx];
  }
  return function wrapped (evt) {
    if (evt.target !== orientation) {
      defineValue(evt, 'target', orientation);
    }
    if (evt.currentTarget !== orientation) {
      defineValue(evt, 'currentTarget', orientation);
    }
    if (evt.type !== 'change') {
      defineValue(evt, 'type', 'change');
    }
    cb(evt);
  };
}

function getLock () {
  var err = 'lockOrientation() is not available on this device.';
  var delegateFn;
  if (typeof screen.msLockOrientation == 'function') {
    delegateFn = screen.msLockOrientation.bind(screen);
  } else if (typeof screen.mozLockOrientation == 'function') {
    delegateFn = screen.mozLockOrientation.bind(screen);
  } else {
    delegateFn = function () { return false; };
  }

  return function lock(lockType) {
    if (delegateFn(lockType)) {
      return Promise.resolve(lockType);
    } else {
      return Promise.reject(new Error(err));
    }
  };
}

function getUnlock () {
  return screen.orientation && screen.orientation.unlock.bind(screen.orientation) ||
    screen.msUnlockOrientation && screen.msUnlockOrientation.bind(screen) ||
    screen.mozUnlockOrientation && screen.mozUnlockOrientation.bind(screen) ||
    function unlock () { return; };
}

function findDelegate () {
  var events = ['orientationchange', 'mozorientationchange', 'msorientationchange'];

  for (var i = 0; i < events.length; i++) {
    if (screen['on' + events[i]] === null) {
      return {
        delegate: screen,
        event: events[i]
      };
    }
  }

  if (typeof window.onorientationchange != 'undefined') {
    return {
      delegate: window,
      event: 'orientationchange'
    };
  }

  return {
    delegate: createOwnDelegate(),
    event: 'change'
  };
}

function getOrientationChangeEvent (name, props) {
  var orientationChangeEvt;

  try {
    orientationChangeEvt = new Event(name, props);
  } catch (e) {
    orientationChangeEvt = { type: 'change' };
  }
  return orientationChangeEvt;
}

function createOwnDelegate () {
  var ownDelegate = Object.create({
    addEventListener: function addEventListener (evt, cb) {
      if (!this.listeners[evt]) {
        this.listeners[evt] = [];
      }
      if (this.listeners[evt].indexOf(cb) === -1) {
        this.listeners[evt].push(cb);
      }
    },
    dispatchEvent: function dispatchEvent (evt) {
      if (!this.listeners[evt.type]) {
        return;
      }
      this.listeners[evt.type].forEach(function (fn) {
        fn(evt);
      });
      if (typeof orientation.onchange == 'function') {
        orientation.onchange(evt);
      }
    },
    removeEventListener: function removeEventListener (evt, cb) {
      if (!this.listeners[evt]) {
        return;
      }
      var idx = this.listeners[evt].indexOf(cb);
      if (idx > -1) {
        this.listeners[evt].splice(idx, 1);
      }
    }
  });

  ownDelegate.listeners = {};

  var mql = getMql();

  if (mql && typeof mql.matches === 'boolean') {
    mql.addListener(function() {
      ownDelegate.dispatchEvent(getOrientationChangeEvent('change'));
    });
  }

  return ownDelegate;
}

function getMql () {
  if (typeof window.matchMedia != 'function') {
    return {};
  }
  return window.matchMedia('(orientation: landscape)');
}

function defineValue(obj, key, val) {
  Object.defineProperty(obj, key, {
    value: val
  });
}

},{}]},{},[1])(1)
});
