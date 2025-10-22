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

      function isInsideHOC(node) {
        if (node.parent?.type === 'CallExpression') {
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
        }

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
        return false;
      }

      if (isInsideHOC(node)) {
        canAutofix = false;
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

          const destructuringPattern = sourceCode.getText(param).replace(paramTypeAnnotation, '').trim();

          fixes.push(fixer.replaceText(param, propsParamText));

          if (node.type === 'ArrowFunctionExpression') {
            if (node.body.type === 'BlockStatement') {
              const openBrace = sourceCode.getFirstToken(node.body);
              const nextToken = sourceCode.getTokenAfter(openBrace);
              const indentation = sourceCode.lines[openBrace.loc.start.line - 1].match(/^\s*/)[0];
              const insertText = `\n${indentation}  const ${destructuringPattern} = props;`;
              fixes.push(fixer.insertTextAfter(openBrace, insertText));
            } else {
              const bodyText = sourceCode.getText(node.body);
              fixes.push(
                fixer.replaceText(node.body, `{ const ${destructuringPattern} = props; return ${bodyText}; }`),
              );
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
