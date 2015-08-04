# Sublime Block Comments for Atom

An Atom Editor plugin for toggling block comments, inspired by Sublime Text.

# Features

- Select code and hit the keybinding to place a block comment around it.
- Place the cursor anywhere inside a block comment and hit the keybinding to uncomment it.
- Hit the keybinding with an empty selection to create an empty block comment, ready to type.
- Supports multiple cursors.

So far this plugin has only been tested with the JavaScript and [Babel](https://github.com/gandm/language-babel) grammars, but it should work on any language that supports the `/* block comment */` syntax. Feel free to send a PR to add support for more languages. :smiley:

# Keymap

- `Ctrl-?` (`Ctrl-Shift-;` for ABNT2 keyboards on Windows/Linux): Toggle block comments.
