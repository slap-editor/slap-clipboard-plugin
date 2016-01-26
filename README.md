# slap-clipboard-plugin DEPRECATED
slap's clipboard plugin

## Installation

Installed by default since 0.1.0 (the first version that supported plugins).
If you are writing your own plugin, you can modify the following install command
to suit your needs:

    $ git clone https://github.com/slap-editor/slap-clipboard-plugin.git ~/.slap/plugins/slap-clipboard-plugin
    $ cd ~/.slap/plugins/slap-clipboard-plugin
    $ npm install

## Description

Adds `copy` (C-c by default), `cut` (C-x), and `paste` (C-v) bindings. Also adds
`Editor.prototype.copy` and `Editor.prototype.paste`.

On Linux, `xclip` is required.
