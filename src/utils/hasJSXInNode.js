/**
 * Проверяет, содержит ли AST узел JSX элементы
 */
function hasJSXInNode(astNode) {
  if (!astNode) return false;

  if (astNode.type && astNode.type.startsWith('JSX')) {
    return true;
  }

  for (const key in astNode) {
    if (key === 'parent' || key === 'range' || key === 'loc') continue;

    const value = astNode[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item !== null && hasJSXInNode(item)) {
          return true;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      if (hasJSXInNode(value)) {
        return true;
      }
    }
  }

  return false;
}

module.exports = hasJSXInNode;
