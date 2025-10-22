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
        const componentsWithChildrenRenderProps = [
          'Field',
          'FastField',
          'Connect',
          'Query',
          'Mutation',
          'Subscription',
        ];

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

    function reportIfDestructured(node, param) {
      const sourceCode = context.getSourceCode();

      let canAutofix = true;

      if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
        const fullText = sourceCode.getText(node);
        const bodyText = sourceCode.getText(node.body);
        const beforeBody = fullText.slice(0, fullText.indexOf(bodyText));
        if (beforeBody.endsWith('(') && bodyText.startsWith('{')) {
          canAutofix = false;
        }
      }

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

      const hocInfo = getHOCInfo(node);

      const report = {
        node: param,
        messageId: 'noDestructuringInParams',
      };

      if (canAutofix) {
        report.fix = function (fixer) {
          const fixes = [];

          const paramTypeAnnotation = param.typeAnnotation ? sourceCode.getText(param.typeAnnotation) : '';

          // For forwardRef, we need to handle two parameters
          if (hocInfo && hocInfo.type === 'forwardRef') {
            // Replace both parameters for forwardRef
            const secondParam = node.params[1];
            const secondParamText = sourceCode.getText(secondParam);
            const propsParamText = paramTypeAnnotation ? `props${paramTypeAnnotation}` : 'props';

            fixes.push(fixer.replaceText(param, propsParamText));
            // Don't replace the second parameter, it's already correct
          } else {
            const propsParamText = paramTypeAnnotation ? `props${paramTypeAnnotation}` : 'props';
            fixes.push(fixer.replaceText(param, propsParamText));
          }

          const destructuringPattern = sourceCode.getText(param).replace(paramTypeAnnotation, '').trim();

          if (node.type === 'ArrowFunctionExpression') {
            if (node.body.type === 'BlockStatement') {
              const openBrace = sourceCode.getFirstToken(node.body);
              const indentation = sourceCode.lines[openBrace.loc.start.line - 1].match(/^\s*/)[0];
              const insertText = `\n${indentation}  const ${destructuringPattern} = props;`;
              fixes.push(fixer.insertTextAfter(openBrace, insertText));
            } else {
              // For arrow functions without block statement
              if (node.body.type && node.body.type.startsWith('JSX')) {
                // For JSX, we need to check if it was wrapped in parentheses in the original code
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
                  fixes.push(fixer.replaceTextRange([arrowToken.range[1], endOfFunction.range[1]], newBodyAndReturn));
                } else {
                  // Single-line JSX without parentheses
                  fixes.push(
                    fixer.replaceText(node.body, `{ const ${destructuringPattern} = props; return ${bodyText}; }`),
                  );
                }
              } else {
                // For non-JSX expressions
                const bodyText = sourceCode.getText(node.body);
                fixes.push(
                  fixer.replaceText(node.body, `{ const ${destructuringPattern} = props; return ${bodyText}; }`),
                );
              }
            }
          } else if (node.type === 'FunctionDeclaration') {
            const openBrace = sourceCode.getFirstToken(node.body);
            const indentation = sourceCode.lines[openBrace.loc.start.line - 1].match(/^\s*/)[0];
            const insertText = `\n${indentation}  const ${destructuringPattern} = props;`;
            fixes.push(fixer.insertTextAfter(openBrace, insertText));
          }

          return fixes;
        };
      }

      context.report(report);
    }

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
              reportIfDestructured(node, param);
            }
          } else if (node.params.length === 2) {
            const firstParam = node.params[0];
            if (firstParam.type === 'ObjectPattern') {
              reportIfDestructured(node, firstParam);
            }
          }
        }
      },
      FunctionDeclaration(node) {
        if (isReactComponent(node)) {
          if (node.params.length === 1 && node.params[0].type === 'ObjectPattern') {
            reportIfDestructured(node, node.params[0]);
          } else if (node.params.length === 2 && node.params[0].type === 'ObjectPattern') {
            reportIfDestructured(node, node.params[0]);
          }
        }
      },
    };
  },
};
