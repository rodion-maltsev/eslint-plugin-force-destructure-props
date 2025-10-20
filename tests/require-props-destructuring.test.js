const { RuleTester } = require('eslint');
const rule = require('../lib/rules/require-props-destructuring');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('require-props-destructuring', rule, {
  valid: [
    {
      code: `export const Comp = (props) => { const { a, b } = props; return null; }`,
    },
    {
      code: `function Comp(props) { const { x } = props; return null; }`,
    },
  ],
  invalid: [
    {
      code: `export const Comp = ({ a, b }) => { return null; }`,
      errors: [{ messageId: 'noDestructuringInParams' }],
    },
    {
      code: `function Comp({ x }) { return null; }`,
      errors: [{ messageId: 'noDestructuringInParams' }],
    },
  ],
});

console.info('All tests passed.');
