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
      context.report({
        node: param,
        messageId: 'noDestructuringInParams',
        fix(fixer) {
          const sourceCode = context.getSourceCode();
          const fixes = [];

          // Извлекаем типизацию из параметра если есть
          const paramTypeAnnotation = param.typeAnnotation ? sourceCode.getText(param.typeAnnotation) : '';
          const propsParamText = paramTypeAnnotation ? `props${paramTypeAnnotation}` : 'props';

          // Получаем паттерн деструктурирования без типизации
          const destructuringPattern = sourceCode.getText(param).split(':')[0].trim();

          fixes.push(fixer.replaceText(param, propsParamText));

          if (node.type === 'ArrowFunctionExpression') {
            if (node.body.type === 'BlockStatement') {
              const openBrace = sourceCode.getFirstToken(node.body);
              fixes.push(fixer.insertTextAfter(openBrace, ` const ${destructuringPattern} = props;`));
            } else {
              fixes.push(
                fixer.replaceText(
                  node.body,
                  `{ const ${destructuringPattern} = props; return ${sourceCode.getText(node.body)}; }`,
                ),
              );
            }
          } else if (node.type === 'FunctionDeclaration') {
            const openBrace = sourceCode.getFirstToken(node.body);
            fixes.push(fixer.insertTextAfter(openBrace, ` const ${destructuringPattern} = props;`));
          }

          return fixes;
        },
      });
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
