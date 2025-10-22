/**
 * Проверяет, является ли узел render prop функцией для Controller или других компонентов
 */
function isControllerRenderProp(node) {
  // Check if this function is passed as render prop to Controller
  // Structure: ArrowFunction -> JSXExpressionContainer -> JSXAttribute -> JSXOpeningElement
  if (
    node.parent?.type === 'JSXExpressionContainer' &&
    node.parent.parent?.type === 'JSXAttribute' &&
    node.parent.parent.name?.name === 'render' &&
    node.parent.parent.parent?.type === 'JSXOpeningElement' &&
    node.parent.parent.parent.name?.name === 'Controller'
  ) {
    return true;
  }

  // Check for JSX children render props (like Field children)
  // Structure: ArrowFunction -> JSXExpressionContainer -> JSXElement
  if (
    node.parent?.type === 'JSXExpressionContainer' &&
    node.parent.parent?.type === 'JSXElement' &&
    node.parent.parent.openingElement?.name?.name
  ) {
    const componentName = node.parent.parent.openingElement.name.name;
    const componentsWithChildrenRenderProps = ['Field', 'FastField', 'Connect', 'Query', 'Mutation', 'Subscription'];

    if (componentsWithChildrenRenderProps.includes(componentName)) {
      return true;
    }
  }

  // Also check for other common render prop patterns
  if (
    node.parent?.type === 'JSXExpressionContainer' &&
    node.parent.parent?.type === 'JSXAttribute' &&
    node.parent.parent.parent?.type === 'JSXOpeningElement'
  ) {
    const propName = node.parent.parent.name?.name;
    const componentName = node.parent.parent.parent.name?.name;

    // Common render prop patterns
    const renderPropNames = ['render', 'children', 'renderItem', 'renderContent', 'renderOption'];
    const componentsWithRenderProps = ['Controller', 'Field', 'FastField', 'Connect', 'Query', 'Mutation'];

    if (renderPropNames.includes(propName) && componentsWithRenderProps.includes(componentName)) {
      return true;
    }
  }

  return false;
}

module.exports = isControllerRenderProp;
