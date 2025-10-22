/**
 * Получает информацию о HOC (Higher-Order Component)
 */
function getHOCInfo(node) {
  if (node.parent?.type === 'CallExpression') {
    const callee = node.parent.callee;
    if (callee.type === 'Identifier' && ['memo', 'forwardRef'].includes(callee.name)) {
      return { type: callee.name, isReactNamed: false };
    }
    if (callee.type === 'MemberExpression') {
      const object = callee.object;
      const property = callee.property;
      if (object && property && object.name === 'React' && ['memo', 'forwardRef'].includes(property.name)) {
        return { type: property.name, isReactNamed: true };
      }
    }
  }

  let current = node.parent;
  while (current) {
    if (current.type === 'VariableDeclarator' && current.init) {
      const init = current.init;
      if (init.type === 'CallExpression') {
        const callee = init.callee;
        if (callee.type === 'Identifier' && ['memo', 'forwardRef'].includes(callee.name)) {
          return { type: callee.name, isReactNamed: false };
        }
        if (callee.type === 'MemberExpression') {
          const object = callee.object;
          const property = callee.property;
          if (object && property && object.name === 'React' && ['memo', 'forwardRef'].includes(property.name)) {
            return { type: property.name, isReactNamed: true };
          }
        }
      }
    }
    current = current.parent;
  }
  return null;
}

module.exports = getHOCInfo;
