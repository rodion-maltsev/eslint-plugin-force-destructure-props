const isReactComponent = require('../utils/isReactComponent');
const isControllerRenderProp = require('../utils/isControllerRenderProp');
const reportIfDestructured = require('../utils/reportIfDestructured');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Force destructuring of props inside function component body instead of parameter list',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/rodion-maltsev/eslint-plugin-force-destructure-props#readme',
    },
    messages: {
      noDestructuringInParams: 'Destructure props inside the component body, not in the parameter list.',
    },
    schema: [],
    fixable: 'code',
    hasSuggestions: false,
  },
  create(context) {
    return {
      ArrowFunctionExpression(node) {
        if (isReactComponent(node)) {
          // Skip if this is a Controller render prop
          if (isControllerRenderProp(node)) {
            return;
          }

          // For regular components: 1 parameter
          // For forwardRef: 2 parameters (props, ref)
          if (node.params.length === 1) {
            const param = node.params[0];
            if (param.type === 'ObjectPattern') {
              reportIfDestructured(context, node, param);
            }
          } else if (node.params.length === 2) {
            const firstParam = node.params[0];
            if (firstParam.type === 'ObjectPattern') {
              reportIfDestructured(context, node, firstParam);
            }
          }
        }
      },
      FunctionDeclaration(node) {
        if (isReactComponent(node)) {
          if (node.params.length === 1 && node.params[0].type === 'ObjectPattern') {
            reportIfDestructured(context, node, node.params[0]);
          } else if (node.params.length === 2 && node.params[0].type === 'ObjectPattern') {
            reportIfDestructured(context, node, node.params[0]);
          }
        }
      },
    };
  },
};
