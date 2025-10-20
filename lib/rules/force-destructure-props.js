module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Force destructuring of props inside function component body instead of parameter list',
    },
    messages: {
      noDestructuringInParams: 'Destructure props inside the component body, not in the parameter list.',
    },
    schema: [],
    fixable: 'code',
  },
  create(context) {
    function isReactComponent(node) {
      const name = node.id?.name || node.parent?.id?.name;
      if (name && /^[A-Z]/.test(name)) return true;

      let hasJSX = false;
      context
        .getSourceCode()
        .getTokens(node.body)
        .forEach((token) => {
          if (token.type === 'JSXText' || token.type === 'JSXIdentifier' || token.type === 'JSXOpeningElement') {
            hasJSX = true;
          }
        });
      return hasJSX;
    }

    function reportIfDestructured(node, param) {
      const sourceCode = context.getSourceCode();

      // Проверяем, является ли это сложным случаем с круглыми скобками
      let canAutofix = true;
      if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
        const fullText = sourceCode.getText(node);
        const bodyText = sourceCode.getText(node.body);
        const beforeBody = fullText.slice(0, fullText.indexOf(bodyText));
        if (beforeBody.endsWith('(') && bodyText.startsWith('{')) {
          canAutofix = false; // Отключаем автофикс для () => ({...})
        }
      }

      const report = {
        node: param,
        messageId: 'noDestructuringInParams',
      };

      if (canAutofix) {
        report.fix = function (fixer) {
          const fixes = [];

          const paramTypeAnnotation = param.typeAnnotation ? sourceCode.getText(param.typeAnnotation) : '';
          const propsParamText = paramTypeAnnotation ? `props${paramTypeAnnotation}` : 'props';

          const paramStart = param.range[0];
          const typeStart = param.typeAnnotation ? param.typeAnnotation.range[0] : param.range[1];
          const destructuringPattern = sourceCode.text.slice(paramStart, typeStart).trim();

          fixes.push(fixer.replaceText(param, propsParamText));

          if (node.type === 'ArrowFunctionExpression') {
            if (node.body.type === 'BlockStatement') {
              const openBrace = sourceCode.getFirstToken(node.body);
              fixes.push(fixer.insertTextAfter(openBrace, ` const ${destructuringPattern} = props;`));
            } else {
              const bodyText = sourceCode.getText(node.body);
              fixes.push(
                fixer.replaceText(node.body, `{ const ${destructuringPattern} = props; return ${bodyText}; }`),
              );
            }
          } else if (node.type === 'FunctionDeclaration') {
            const openBrace = sourceCode.getFirstToken(node.body);
            fixes.push(fixer.insertTextAfter(openBrace, ` const ${destructuringPattern} = props;`));
          }

          return fixes;
        };
      }

      context.report(report);
    }

    return {
      ArrowFunctionExpression(node) {
        const parent = node.parent;
        if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier' && node.params.length === 1) {
          const param = node.params[0];
          if (param.type === 'ObjectPattern' && isReactComponent(node)) {
            reportIfDestructured(node, param);
          }
        }
      },
      FunctionDeclaration(node) {
        if (node.params.length === 1 && node.params[0].type === 'ObjectPattern' && isReactComponent(node)) {
          reportIfDestructured(node, node.params[0]);
        }
      },
    };
  },
};
