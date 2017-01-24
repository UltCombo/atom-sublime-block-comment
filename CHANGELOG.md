## 0.5.1

- Fixed a small optimization.

## 0.5.0

- Added support for the Python language. ([#4](https://github.com/UltCombo/atom-sublime-block-comment/pull/4) @FelixVicis, @UltCombo)

## 0.4.0

- Added "Pad with spaces" setting. ([#3](https://github.com/UltCombo/atom-sublime-block-comment/pull/3) @scowalt, @UltCombo)

## 0.3.1

- Improved PHP support: now the correct comment syntax is applied to HTML inside PHP files (outside of `<?php ?>` and `<?= ?>` tags). (@UltCombo)

## 0.3.0

- Added support for the PHP language. ([#2](https://github.com/UltCombo/atom-sublime-block-comment/pull/2) @Benoth)

## 0.2.1

- README: removed outdated info, added contributing section.

## 0.2.0

- Added support for HTML and embedded languages. ([#1](https://github.com/UltCombo/atom-sublime-block-comment/pull/1) @Slepice1)
- Fixed resources disposal on package deactivation. You may need to restart Atom after updating, as the previous versions did not handle package deactivation correctly. (@UltCombo)
- Refactoring: it is much easier to add support for more languages now. (@UltCombo)
- Cleanup: fixed export syntax to not break in future Babel versions ([[1]](https://github.com/babel/babel/issues/2212)). (@UltCombo)

## 0.1.1

- Fixed uncommenting when selection range start and range end are at the end of a comment close token followed by code in the same line. (@UltCombo)
- Fixed behavior regarding selections that span across multiple comments and end at the end of a close comment token. (@UltCombo)
- Cleaned up code style. (@UltCombo)

## 0.1.0 - First Release
