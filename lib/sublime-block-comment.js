'use babel';

import { Point, Range } from 'atom';

import core from 'core-js/library';
const { find } = core.Array.prototype;

const disposables = [];

const Lang = (rLangScope, openCommentToken, closeCommentToken) => ({
  test: (scope) => rLangScope.test(scope),
  commentTokens: { open: openCommentToken, close: closeCommentToken },
});
const langs = [
  Lang(/^source\.js\.?/ ,   '/*'  , '*/' ),
  Lang(/^source\.css\.?/,   '/*'  , '*/' ),
  Lang(/^source\.php\.?/,   '/*'  , '*/' ),
  Lang(/^text\.html\.?/ ,   '<!--', '-->'),
  Lang(/^source\.python\.?/, "'''", "'''"),
];

export const config = {
  pad: {
    title: 'Pad with spaces',
    description: 'Pad selection with whitespace when commenting.',
    type: 'boolean',
    default: false,
  },
};

export function activate() {
  disposables.push(atom.commands.add('atom-text-editor:not([mini])', { 'sublime-block-comment:toggle': toggle }));
}

export function deactivate() {
  for (const disposable of disposables) disposable.dispose();
  disposables.length = 0;
}

function toggle() {
  const editor = atom.workspace.getActiveTextEditor();
  if (!editor) return;

  const buffer = editor.getBuffer();
  const padding = atom.config.get('sublime-block-comment.pad') ? ' ' : '';

  buffer.transact(() => {
    for (const selection of editor.getSelectionsOrderedByBufferPosition().reverse()) {
      const range = selection.getBufferRange();
      const textInRange = buffer.getTextInRange(range);
      const scopes = getPositionScopes(range.start).reverse();

      let lang;
      if (!scopes.some((scope) => lang = langs::find((lang) => lang.test(scope)))) lang = langs[0];
      const commentTokens = lang.commentTokens;

      // If we are inside a block comment or have one fully or partially selected, uncomment it.
      if (
        (isInsideBlockComment(range.start) || isAtCloseCommentToken(range.start, commentTokens.close))
        && (isInsideBlockComment(range.end) || isAtCloseCommentToken(range.end, commentTokens.close))
        && ~[-1, textInRange.length - commentTokens.close.length].indexOf(textInRange.indexOf(commentTokens.close))
      ) {
        let blockCommentCloseRange;
        const lastRow = buffer.getLastRow();
        for (let row = range.end.row; !blockCommentCloseRange && row <= lastRow; row++) {
          const line = buffer.lineForRow(row);
          for (
            let column = row === range.end.row
              ? Math.max(range.end.column - commentTokens.close.length + (
                // Python has the same tokens for block string begin and end, so we need an extra sanity check.
                // This logic would not work with JavaScript anyway as it the comment begin/end tokens don't have dedicated scopes.
                isPythonStringBlockBegin(range.end)
                  ? commentTokens.open.length + 1
                  : 0
              ), 0)
              : 0;
            (column = line.indexOf(commentTokens.close, column)) !== -1;
            column++
          ) {
            if (isCommentDefinitionPunctuation([row, column])) {
              blockCommentCloseRange = new Range([row, column], [row, column + commentTokens.close.length]);
              break;
            }
          }
        }

        let blockCommentOpenRange;
        for (let row = range.start.row; !blockCommentOpenRange && row >= 0; row--) {
          let line = buffer.lineForRow(row);
          for (
            let column = row === range.start.row
              ? (
                blockCommentCloseRange && row === blockCommentCloseRange.start.row
                  // Python has the same tokens for block string begin and end, so we need an extra sanity check.
                  // If end token is at the beginning of a line (column 0), skip to the line above to avoid matching the end token as the begin token as well.
                  ? (blockCommentCloseRange.start.column - 1 > 0 ? blockCommentCloseRange.start.column - 1 : (--row, line = buffer.lineForRow(row), line.length))
                  : Math.min(range.start.column + commentTokens.open.length, line.length)
              )
              : line.length;
            (column = line.lastIndexOf(commentTokens.open, column)) !== -1;
            column--
          ) {
            if (isCommentDefinitionPunctuation([row, column])) {
              blockCommentOpenRange = new Range([row, column], [row, column + commentTokens.open.length]);
              break;
            }
          }
        }

        if (blockCommentCloseRange) {
          if (padding) {
            const blockCommentClosePaddedRangeStart = new Point(blockCommentCloseRange.start.row, blockCommentCloseRange.start.column - padding.length);
            if (
              (!blockCommentOpenRange || blockCommentClosePaddedRangeStart.compare(blockCommentOpenRange.end) >= 0)
              && buffer.getTextInRange([blockCommentClosePaddedRangeStart, blockCommentCloseRange.start]) === padding
            ) {
              blockCommentCloseRange.start = blockCommentClosePaddedRangeStart;
            }
          }
          buffer.delete(blockCommentCloseRange);
        }

        if (blockCommentOpenRange) {
          if (padding) {
            const blockCommentOpenPaddedRangeEnd = new Point(blockCommentOpenRange.end.row, blockCommentOpenRange.end.column + padding.length);
            if (
              // This sanity check also prevents excessively removing "overlapping" start/end padding.
              // E.g.: "/* */ a" => " a" instead of "a"
              (!blockCommentCloseRange || blockCommentOpenPaddedRangeEnd.compare(blockCommentCloseRange.start) <= 0)
              && buffer.getTextInRange([blockCommentOpenRange.end, blockCommentOpenPaddedRangeEnd]) === padding
            ) {
              blockCommentOpenRange.end = blockCommentOpenPaddedRangeEnd;
            }
          }
          buffer.delete(blockCommentOpenRange);
        }

        continue;
      }

      // Else, wrap selection with block comment.
      buffer.insert(range.end, padding + commentTokens.close);
      buffer.insert(range.start, commentTokens.open + padding);

      // Unselect the opening and closing comment tokens.
      const startRowColumnOffset = commentTokens.open.length + padding.length;
      selection.setBufferRange([
        [range.start.row, range.start.column + startRowColumnOffset],
        [range.end.row, range.end.column + (range.start.row === range.end.row ? startRowColumnOffset : 0)]
      ]);
    }
  });


  function isInsideBlockComment(position) {
    const scopes = getPositionScopes(position);
    const commentScopePrefix = `${isPythonSource(scopes) ? 'string.quoted.single' : 'comment'}.block.`;
    return scopes.some((scope) => scope.startsWith(commentScopePrefix));
  }

  function isCommentDefinitionPunctuation(position) {
    const scopes = getPositionScopes(position);
    const commentPunctuationScopePrefix = `punctuation.definition.${isPythonSource(scopes) ? 'string' : 'comment'}.`;
    return scopes.some((scope) => scope.startsWith(commentPunctuationScopePrefix));
  }

  function getPositionScopes(position) {
    return editor.scopeDescriptorForBufferPosition(position).getScopesArray();
  }

  function isAtCloseCommentToken(position, closeCommentToken) {
    return position.column >= closeCommentToken.length
      && buffer.getTextInRange([[position.row, position.column - closeCommentToken.length], position]) === closeCommentToken
      && isCommentDefinitionPunctuation([position.row, position.column - 1]);
  }

  function isPythonSource(scopes) {
    return scopes[0] === 'source.python';
  }

  function isPythonPunctuationDefinitionStringBegin(scope) {
    return scope === 'punctuation.definition.string.begin.python';
  }

  function isPythonStringBlockBegin(position) {
    return isInsideBlockComment(position) && (
      getPositionScopes(position).some(isPythonPunctuationDefinitionStringBegin) ||
      // Atom does not identify the position at the end of the begin token as part of its scope, therefore we check one column to the left as well.
      (position.column > 0 && getPositionScopes([position.row, position.column - 1]).some(isPythonPunctuationDefinitionStringBegin))
    );
  }
}
