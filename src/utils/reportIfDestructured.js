const createFix = require('./createFix');

/**
 * Сообщает об ошибке деструктуризации props в параметрах и предоставляет автофикс
 */
function reportIfDestructured(context, node, param) {
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

  const report = {
    node: param,
    messageId: 'noDestructuringInParams',
  };

  if (canAutofix) {
    report.fix = createFix(node, param, sourceCode);
  }

  context.report(report);
}

module.exports = reportIfDestructured;
