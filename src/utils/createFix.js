const getHOCInfo = require('./getHOCInfo');

/**
 * Создает фикс для автоматического исправления деструктуризации props
 */
function createFix(node, param, sourceCode) {
  const fixes = [];
  const paramTypeAnnotation = param.typeAnnotation ? sourceCode.getText(param.typeAnnotation) : '';
  const hocInfo = getHOCInfo(node);

  // For forwardRef, we need to handle two parameters
  if (hocInfo && hocInfo.type === 'forwardRef') {
    const propsParamText = paramTypeAnnotation ? `props${paramTypeAnnotation}` : 'props';
    fixes.push((fixer) => fixer.replaceText(param, propsParamText));
  } else {
    const propsParamText = paramTypeAnnotation ? `props${paramTypeAnnotation}` : 'props';
    fixes.push((fixer) => fixer.replaceText(param, propsParamText));
  }

  const destructuringPattern = sourceCode.getText(param).replace(paramTypeAnnotation, '').trim();

  if (node.type === 'ArrowFunctionExpression') {
    if (node.body.type === 'BlockStatement') {
      const openBrace = sourceCode.getFirstToken(node.body);
      const indentation = sourceCode.lines[openBrace.loc.start.line - 1].match(/^\s*/)[0];
      const insertText = `\n${indentation}  const ${destructuringPattern} = props;`;
      fixes.push((fixer) => fixer.insertTextAfter(openBrace, insertText));
    } else {
      // For arrow functions without block statement
      if (node.body.type && node.body.type.startsWith('JSX')) {
        const functionText = sourceCode.getText(node);
        const bodyText = sourceCode.getText(node.body);
        const beforeBody = functionText.slice(0, functionText.indexOf(bodyText));
        const afterBody = functionText.slice(functionText.indexOf(bodyText) + bodyText.length);

        // Check if JSX is wrapped in parentheses in the original source
        const hasParentheses = beforeBody.trim().endsWith('(') && afterBody.trim().startsWith(')');

        if (hasParentheses) {
          // Multi-line JSX with parentheses - need to replace from '=>' onwards
          const arrowIndex = functionText.indexOf('=>');
          const arrowToken = sourceCode.getTokenByRangeStart(node.range[0] + arrowIndex);
          const endOfFunction = sourceCode.getLastToken(node);

          const indentation = sourceCode.lines[node.loc.start.line - 1].match(/^\s*/)[0];
          const bodyLines = bodyText.split('\n');

          // Find the base indentation of JSX (first non-empty line)
          let baseJSXIndent = 0;
          for (const line of bodyLines) {
            if (line.trim()) {
              baseJSXIndent = line.search(/\S/);
              break;
            }
          }

          const indentedJSX = bodyLines
            .map((line, index) => {
              if (!line.trim()) return line;
              const currentIndent = line.search(/\S/);
              const relativeIndent = currentIndent - baseJSXIndent;
              return `${indentation}    ${' '.repeat(Math.max(0, relativeIndent))}${line.trim()}`;
            })
            .join('\n');

          const newBodyAndReturn = ` {\n${indentation}  const ${destructuringPattern} = props;\n${indentation}  return (\n${indentedJSX}\n${indentation}  );\n${indentation}}`;

          // Replace from after '=>' to end of function
          fixes.push((fixer) =>
            fixer.replaceTextRange([arrowToken.range[1], endOfFunction.range[1]], newBodyAndReturn),
          );
        } else {
          // Single-line JSX without parentheses
          fixes.push((fixer) =>
            fixer.replaceText(node.body, `{ const ${destructuringPattern} = props; return ${bodyText}; }`),
          );
        }
      } else {
        // For non-JSX expressions
        const bodyText = sourceCode.getText(node.body);
        fixes.push((fixer) =>
          fixer.replaceText(node.body, `{ const ${destructuringPattern} = props; return ${bodyText}; }`),
        );
      }
    }
  } else if (node.type === 'FunctionDeclaration') {
    const openBrace = sourceCode.getFirstToken(node.body);
    const indentation = sourceCode.lines[openBrace.loc.start.line - 1].match(/^\s*/)[0];
    const insertText = `\n${indentation}  const ${destructuringPattern} = props;`;
    fixes.push((fixer) => fixer.insertTextAfter(openBrace, insertText));
  }

  return function (fixer) {
    return fixes.map((fixFn) => fixFn(fixer)).flat();
  };
}

module.exports = createFix;
