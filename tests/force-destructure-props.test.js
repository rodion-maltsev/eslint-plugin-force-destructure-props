const { RuleTester } = require('eslint');
const rule = require('../lib/rules/force-destructure-props');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { jsx: true },
      requireConfigFile: false,
      babelOptions: {
        presets: ['@babel/preset-react'],
      },
    },
    parser: require('@babel/eslint-parser'),
  },
});

ruleTester.run('force-destructure-props', rule, {
  valid: [
    {
      code: `const helper = ({ a }) => a + 1;`,
    },
    {
      code: `function util({ x }) { return x * 2; }`,
    },
    {
      code: `const Comp = (props) => { const { a, b } = props; return <div />; }`,
    },
    {
      code: `function Comp(props) { const { x } = props; return <span />; }`,
    },
  ],
  invalid: [
    {
      code: `const Comp = ({ a, b }) => { return <div />; }`,
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const Comp = (props) => { const { a, b } = props; return <div />; }`,
    },
    {
      code: `function Comp({ x }) { return <span />; }`,
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `function Comp(props) { const { x } = props; return <span />; }`,
    },
    {
      code: `const AnotherComp = ({ y }) => <y />;`,
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const AnotherComp = (props) => { const { y } = props; return <y />; };`,
    },
  ],
});

console.info('All tests passed.');
