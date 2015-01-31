var path = require('path');
var Promise = require('node_modules/bluebird');
var _ = require('node_modules/lazy.js');
var rc = require('node_modules/rc');
var Editor = require('lib/ui/Editor');
var util = require('lib/util');
var clipboard = Promise.promisifyAll(require('copy-paste'));

var package = require('./package');
var configFile = path.join(__dirname, package.name + '.ini');
var opts = util.parseOpts(rc(package.name, configFile));

Editor.prototype.copy = Promise.method(function () {
  var self = this;
  var text = self.textBuf.getTextInRange(self.selection.getRange());
  var promise = Promise.resolve(self);
  if (text) promise = clipboard.copyAsync(self.data.clipboard = text).then(promise);
  return promise;
});
Editor.prototype.paste = Promise.method(function () {
  var self = this;
  return clipboard.pasteAsync()
    .catch(function (err) {
      switch (err.code) {
        case 'ENOENT':
          self.slap.header.message("install xclip to use system clipboard", 'warning');
          break;
      }
      return self.data.clipboard;
    })
    .then(function (text) {
      if (typeof text === 'string') {
        self.textBuf.setTextInRange(self.selection.getRange(), text);
        self.selection.reversed = false;
        self.selection.clearTail();
      }
      return self;
    });
});

var _initHandlers = Editor.prototype._initHandlers;
Editor.prototype._initHandlers = function () {
  self.ready.then(function () { self._initSlapClipboardPlugin(); }).done();
  return _initHandlers.apply(self, arguments);
};

Editor.prototype._initSlapClipboardPlugin = function () {
  var self = this;
  var bindings = _(opts.editor.bindings).merge(self.options.bindings || {}).toObject();
  self.on('keypress', function (ch, key) {
    logger.debug('binding', util.getBinding(bindings, key));
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
