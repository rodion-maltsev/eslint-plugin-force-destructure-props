const { RuleTester } = require('eslint');
const rule = require('../lib/rules/force-destructure-props');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
    parser: require('@typescript-eslint/parser'),
  },
});

ruleTester.run('force-destructure-props (JavaScript)', rule, {
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

ruleTester.run('force-destructure-props (TypeScript)', rule, {
  valid: [
    {
      code: `const helper = ({ a }: { a: number }) => a + 1;`,
      filename: 'test.tsx',
    },
    {
      code: `function util({ x }: { x: number }) { return x * 2; }`,
      filename: 'test.tsx',
    },
    {
      code: `const Comp = (props: { a: string; b: number }) => { const { a, b } = props; return <div />; }`,
      filename: 'test.tsx',
    },
    {
      code: `function Comp(props: { x: string }) { const { x } = props; return <span />; }`,
      filename: 'test.tsx',
    },
  ],
  invalid: [
    {
      code: `const Component = ({ onId }: { onId: (id: string) => void }) => { return <div />; }`,
      filename: 'test.tsx',
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const Component = (props: { onId: (id: string) => void }) => { const { onId } = props; return <div />; }`,
    },
    {
      code: `function MyComponent({ value, onChange }: { value: string; onChange: (v: string) => void }) { return <span />; }`,
      filename: 'test.tsx',
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `function MyComponent(props: { value: string; onChange: (v: string) => void }) { const { value, onChange } = props; return <span />; }`,
    },
    {
      code: `const ButtonComponent = ({ text, disabled }: { text: string; disabled?: boolean }) => <button disabled={disabled}>{text}</button>;`,
      filename: 'test.tsx',
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const ButtonComponent = (props: { text: string; disabled?: boolean }) => { const { text, disabled } = props; return <button disabled={disabled}>{text}</button>; };`,
    },
    {
      code: `const renderProductCell = ({
  row: { name, carrier, productType, duration, returnRate, state: stateOfIssue, firstInsured, secondInsured, status },
  withLinkToCarrierPage = false,
}: RenderIllustrationProductCellParams) => { return <div />; }`,
      filename: 'test.tsx',
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const renderProductCell = (props: RenderIllustrationProductCellParams) => { const {
  row: { name, carrier, productType, duration, returnRate, state: stateOfIssue, firstInsured, secondInsured, status },
  withLinkToCarrierPage = false,
} = props; return <div />; }`,
    },
  ],
});

console.info('All tests passed.');
