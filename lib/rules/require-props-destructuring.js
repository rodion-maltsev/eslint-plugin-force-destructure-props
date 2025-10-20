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
  },
  create(context) {
    return {
      ArrowFunctionExpression(node) {
        const parent = node.parent;
        if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier' && node.params.length === 1) {
          const param = node.params[0];
          if (param.type === 'ObjectPattern') {
            context.report({
              node: param,
              messageId: 'noDestructuringInParams',
            });
          }
        }
      },
      FunctionDeclaration(node) {
        if (node.params.length === 1 && node.params[0].type === 'ObjectPattern') {
          context.report({
            node: node.params[0],
            messageId: 'noDestructuringInParams',
          });
        }
      },
    };
  },
};
