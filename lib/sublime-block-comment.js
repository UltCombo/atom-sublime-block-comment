'use babel';

export default {
  activate() {
    atom.commands.add('atom-text-editor:not([mini])', { 'sublime-block-comment:toggle': this.toggle });
  },
  toggle() {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) return;

    const buffer = editor.getBuffer();

    buffer.transact(() => {
      for (const selection of editor.getSelectionsOrderedByBufferPosition().reverse()) {
        const range = selection.getBufferRange();
        const textInRange = buffer.getTextInRange(range);

        // TODO change comment syntax based on scope's grammar
        const commentTokens = {
          open:  '/*',
          close: '*/',
        };

        // If we are inside a block comment or have one fully or partially selected, uncomment it.
        if ((isInsideBlockComment(range.start) || isAtCloseCommentToken(range.start, commentTokens.close))
          && (isInsideBlockComment(range.end) || isAtCloseCommentToken(range.end, commentTokens.close))
          && ~[-1, textInRange.length - commentTokens.close.length].indexOf(textInRange.indexOf(commentTokens.close))
        ) {
          let blockCommentCloseRange;
          const lastRow = buffer.getLastRow();
          for (let row = range.end.row; !blockCommentCloseRange && row <= lastRow; row++) {
            const line = buffer.lineForRow(row);
            for (let column = row === range.end.row ? Math.max(range.end.column - commentTokens.close.length, 0) : 0; (column = line.indexOf(commentTokens.close, column)) !== -1; column++) {
              if (isCommentDefinitionPunctuation([row, column])) {
                blockCommentCloseRange = [[row, column], [row, column + commentTokens.close.length]];
                break;
              }
            }
          }

          let blockCommentOpenRange;
          for (let row = range.start.row; !blockCommentOpenRange && row >= 0; row--) {
            const line = buffer.lineForRow(row);
            for (let column = row === range.start.row ? (blockCommentCloseRange && row === blockCommentCloseRange[0][0] ? blockCommentCloseRange[0][1] : Math.min(range.start.column + commentTokens.open.length, line.length)) : line.length; (column = line.lastIndexOf(commentTokens.open, column)) !== -1; column--) {
              if (isCommentDefinitionPunctuation([row, column])) {
                blockCommentOpenRange = [[row, column], [row, column + commentTokens.open.length]];
                break;
              }
            }
          }

          if (blockCommentCloseRange) buffer.delete(blockCommentCloseRange);
          if (blockCommentOpenRange) buffer.delete(blockCommentOpenRange);

          continue;
        }

        // Else, wrap selection with block comment.
        buffer.insert(range.end, commentTokens.close);
        buffer.insert(range.start, commentTokens.open);

        // Unselect the opening and closing comment tokens.
        var columnOffset = commentTokens.open.length;
        selection.setBufferRange([
          [range.start.row, range.start.column + columnOffset],
          [range.end.row, range.end.column + (range.start.row === range.end.row ? columnOffset : 0)]
        ]);
      }
    });


    function isInsideBlockComment(position) {
      return getPositionScopes(position).some((scope) => scope.startsWith('comment.block.'));
    }

    function isCommentDefinitionPunctuation(position) {
      return getPositionScopes(position).some((scope) => scope.startsWith('punctuation.definition.comment.'));
    }

    function getPositionScopes(position) {
      return editor.scopeDescriptorForBufferPosition(position).getScopesArray();
    }

    function isAtCloseCommentToken(position, closeCommentToken) {
      return position.column >= closeCommentToken.length
        && buffer.getTextInRange([[position.row, position.column - closeCommentToken.length], position]) === closeCommentToken
        && isCommentDefinitionPunctuation([position.row, position.column - 1]);
    }
  },
};
