var path = require('path');
var Promise = require('bluebird');
var _ = require('lazy.js');
var rc = require('rc');
var clipboard = Promise.promisifyAll(require('copy-paste'));

var Slap = require.main.require('./lib/ui/Slap');
var Editor = require.main.require('./lib/ui/Editor');
var util = require.main.require('./lib/util');

var package = require('./package');
var configFile = path.join(__dirname, package.name + '.ini');
var opts = util.parseOpts(rc(package.name, configFile));

Editor.prototype.copy = Promise.method(function () {
  var self = this;
  var text = self.textBuf.getTextInRange(self.selection.getRange());
  if (!text) return self;
  return clipboard.copyAsync(self.data.clipboard = text)
    .catch(function (err) {
      switch (err.code) {
        case 'EPIPE':
          self.slap._warnAboutXclip();
          break;
      }
    })
    .tap(function () { logger.debug("copied " + text.length + " characters"); })
    .return(self);
});
Editor.prototype.paste = Promise.method(function () {
  var self = this;
  return clipboard.pasteAsync()
    .catch(function (err) {
      switch (err.code) {
        case 'ENOENT':
          self.slap._warnAboutXclip();
          break;
      }
      return self.data.clipboard;
    })
    .then(function (text) {
      if (typeof text === 'string') {
        self.textBuf.setTextInRange(self.selection.getRange(), text);
        self.selection.reversed = false;
        self.selection.clearTail();
        logger.debug("pasted " + text.length + " characters");
      }
      return self;
    });
});

Slap.prototype._warnAboutXclip = function () {
  if (this._warnedAboutXclip) return;
  this.header.message("install xclip to use system clipboard", 'warning');
  this._warnedAboutXclip = true;
};

var _initHandlers = Editor.prototype._initHandlers;
Editor.prototype._initHandlers = function () {
  var self = this;
  self.ready.then(function () { self._initSlapClipboardPlugin(); }).done();
  return _initHandlers.apply(self, arguments);
};

Editor.prototype._initSlapClipboardPlugin = function () {
  var self = this;
  var bindings = _(opts.editor.bindings).merge(self.options.bindings || {}).toObject();
  self.on('keypress', function (ch, key) {
    var binding = util.getBinding(bindings, key);
    switch (binding) {
      case 'copy':
      case 'cut':
        self.copy().done();
        if (binding === 'cut') self.delete();
        return false;
      case 'paste': self.paste().done(); return false;
    };
  });
};

module.exports = function (slap) {
  slap.panes.forEach(function (pane) {
    pane.editor._initSlapClipboardPlugin();
  });
};
