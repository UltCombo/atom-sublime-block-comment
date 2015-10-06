## 0.3.1

- Improved PHP support: now the correct comment syntax is applied to HTML inside PHP files (outside of `<?php ?>` and `<?= ?>` tags).

## 0.3.0

- Added support for the PHP language.

## 0.2.1

- README: removed outdated info, added contributing section.

## 0.2.0

- Added support for HTML and embedded languages.
- Fixed resources disposal on package deactivation. You may need to restart Atom after updating, as the previous versions did not handle package deactivation correctly.
- Refactoring: it is much easier to add support for more languages now.
- Cleanup: fixed export syntax to not break in future Babel versions ([[1]](https://github.com/babel/babel/issues/2212)).

## 0.1.1

- Fixed uncommenting when selection range start and range end are at the end of a comment close token followed by code in the same line.
- Fixed behavior regarding selections that span across multiple comments and end at the end of a close comment token.
- Cleaned up code style.

## 0.1.0 - First Release
