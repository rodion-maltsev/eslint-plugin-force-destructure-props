const hasJSXInNode = require('./hasJSXInNode');

/**
 * Определяет, является ли узел React компонентом
 */
function isReactComponent(node) {
  let name = null;

  if (node.type === 'FunctionDeclaration') {
    name = node.id?.name;
  } else if (node.type === 'ArrowFunctionExpression') {
    if (node.parent?.type === 'VariableDeclarator') {
      name = node.parent.id?.name;
    } else if (node.parent?.type === 'CallExpression' && node.parent.parent?.type === 'VariableDeclarator') {
      name = node.parent.parent.id?.name;
    }
  }

  // Functions starting with lowercase are not components
  if (name && /^[a-z]/.test(name)) {
    return false;
  }

  // Check for memo/forwardRef HOCs first
  if (node.type === 'ArrowFunctionExpression' && node.parent?.type === 'CallExpression') {
    const callee = node.parent.callee;

    if (callee.type === 'Identifier' && ['memo', 'forwardRef'].includes(callee.name)) {
      return true;
    }

    if (callee.type === 'MemberExpression') {
      const object = callee.object;
      const property = callee.property;
      if (object && property && object.name === 'React' && ['memo', 'forwardRef'].includes(property.name)) {
        return true;
      }
    }

    // For other function calls, this is a callback, not a component
    return false;
  }

  if (node.type === 'ArrowFunctionExpression') {
    let current = node.parent;
    while (current) {
      if (current.type === 'VariableDeclarator' && current.init) {
        const init = current.init;
        if (init.type === 'CallExpression') {
          const callee = init.callee;
          if (callee.type === 'Identifier' && ['memo', 'forwardRef'].includes(callee.name)) {
            return true;
          }
          if (callee.type === 'MemberExpression') {
            const object = callee.object;
            const property = callee.property;
            if (object && property && object.name === 'React' && ['memo', 'forwardRef'].includes(property.name)) {
              return true;
            }
          }
        }
      }
      current = current.parent;
    }
  }

  const hasJSX = hasJSXInNode(node.body);

  // If function has JSX, it's definitely a component
  if (hasJSX) {
    return true;
  }

  // If no JSX and no HOC, not a component regardless of name
  return false;
}

module.exports = isReactComponent;
