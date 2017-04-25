(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var process;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("initialize.js", function(exports, require, module) {
'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require('rxjs');

var _rxjs2 = _interopRequireDefault(_rxjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var canvas = void 0;
var cw = void 0;
var ch = void 0;
var cx = void 0;

var scale = 3;

var imageData = void 0;
var colorData = void 0;
var pixmap = [];
var colors = ['black', 'blue', 'darkred', 'darkmagenta', 'green', 'cyan', 'yellow', 'whitesmoke', 'black', 'lightblue', 'red', 'magenta', 'greenyellow', 'lightcyan', 'lightyellow', 'white'];

var tape$ = void 0;
var dataPos = 0;
var colorPos = 0;
var INTERVAL_COLOR = 50;
var INTERVAL_IMAGE = 50;
var SIMULATE_TAPE = true;

var getY = function getY(offset) {
  return (offset >> 11 << 6) + (offset % 2048 >> 8) + ((offset % 2048 >> 5) - (offset % 2048 >> 8 << 3) << 3);
};

var getX = function getX(offset) {
  return offset % 32 << 3;
};

var drawImageStart = function drawImageStart() {
  var chunks = _lodash2.default.chunk(imageData, 16);
  tape$ = new _rxjs2.default.Observable.from(chunks);

  if (SIMULATE_TAPE) {
    tape$.zip(_rxjs2.default.Observable.interval(INTERVAL_IMAGE), function (x, y) {
      return x;
    }).subscribe(drawImage, undefined, drawImageEnd);
  } else {
    tape$.subscribe(drawImage, undefined, drawImageEnd);
  }
};

var drawImageEnd = function drawImageEnd() {
  drawColorsStart();
};

var drawImage = function drawImage(bytes) {
  var color = void 0;

  bytes.forEach(function (data) {
    pixmap[getX(dataPos) >> 3][getY(dataPos)] = data;

    for (var currentByte = 0; currentByte < 8; currentByte++) {
      var x = getX(dataPos) + currentByte;
      var y = getY(dataPos);

      if (data & 128 >> currentByte) {
        color = colors[7];
      } else {
        color = colors[0];
      }

      cx.beginPath();
      cx.fillStyle = color;
      cx.fillRect(x * scale, y * scale, scale, scale);
    }

    dataPos++;
  });
};

var drawColorsStart = function drawColorsStart() {
  var chunks = _lodash2.default.chunk(colorData, 16);
  tape$ = new _rxjs2.default.Observable.from(chunks);

  if (SIMULATE_TAPE) {
    tape$.zip(_rxjs2.default.Observable.interval(INTERVAL_COLOR), function (x, y) {
      return x;
    }).subscribe(drawColors);
  } else {
    tape$.subscribe(drawColors);
  }
};

var drawColors = function drawColors(bytes) {
  var color = void 0;

  bytes.forEach(function (data) {
    for (var y = 0; y < 8; y++) {
      for (var x = 0; x < 8; x++) {
        if (pixmap[colorPos % 32][(colorPos >> 5 << 3) + y] & 128 >> x) {
          color = colors[(data & 7) + 8 * (data >> 6 & 1)];
        } else {
          color = colors[(data >> 3 & 7) + 8 * (data >> 6 & 1)];
        }

        cx.beginPath();
        cx.fillStyle = color;

        var ux = (colorPos % 32 << 3) + x;
        var uy = (colorPos >> 5 << 3) + y;
        var w = (colorPos % 32 << 3) + x + 1 - (colorPos % 32 << 3) + x;
        var h = (colorPos / 32 << 3) + y + 1 - (colorPos >> 5 << 3) + y;

        cx.fillRect(ux * scale, uy * scale, w * scale, h * scale);
      }
    }

    colorPos++;
  });
};

document.addEventListener('DOMContentLoaded', function () {
  canvas = document.getElementById('canvas');
  cx = canvas.getContext('2d');
  cw = canvas.width;
  ch = canvas.height;

  for (var i = 0; i < 32; i++) {
    pixmap[i] = [];
  }

  fetch('./GlugGlug.scr').then(function (response) {
    var reader = response.body.getReader();

    reader.read().then(function (result) {
      imageData = result.value.slice(0, 6144);
      colorData = result.value.slice(6144);

      drawImageStart();
    });
  }).catch(function (err) {
    console.log('Fetch Error :-S', err);
  });
});

});

require.alias("buffer/index.js", "buffer");
require.alias("process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map