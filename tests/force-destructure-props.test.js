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
      code: `const helper = ({ value }) => value + 1;`,
    },
    {
      code: `function util({ input }) { return input * 2; }`,
    },
    {
      code: `const Component = (props) => { const { title, content } = props; return <div />; }`,
    },
    {
      code: `function Component(props) { const { data } = props; return <span />; }`,
    },
  ],
  invalid: [
    {
      code: `const Component = ({ title, content }) => { return <div />; }`,
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const Component = (props) => { const { title, content } = props; return <div />; }`,
    },
    {
      code: `function Component({ data }) { return <span />; }`,
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `function Component(props) { const { data } = props; return <span />; }`,
    },
    {
      code: `const Widget = ({ config }) => <div />;`,
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const Widget = (props) => { const { config } = props; return <div />; };`,
    },
  ],
});

ruleTester.run('force-destructure-props (TypeScript)', rule, {
  valid: [
    {
      code: `const helper = ({ value }: { value: number }) => value + 1;`,
      filename: 'test.tsx',
    },
    {
      code: `function util({ input }: { input: number }) { return input * 2; }`,
      filename: 'test.tsx',
    },
    {
      code: `const Component = (props: { title: string; content: number }) => { const { title, content } = props; return <div />; }`,
      filename: 'test.tsx',
    },
    {
      code: `function Component(props: { data: string }) { const { data } = props; return <span />; }`,
      filename: 'test.tsx',
    },
  ],
  invalid: [
    {
      code: `const Component = ({ callback }: { callback: (id: string) => void }) => { return <div />; }`,
      filename: 'test.tsx',
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const Component = (props: { callback: (id: string) => void }) => { const { callback } = props; return <div />; }`,
    },
    {
      code: `function FormComponent({ value, onChange }: { value: string; onChange: (v: string) => void }) { return <span />; }`,
      filename: 'test.tsx',
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `function FormComponent(props: { value: string; onChange: (v: string) => void }) { const { value, onChange } = props; return <span />; }`,
    },
    {
      code: `const Button = ({ label, disabled }: { label: string; disabled?: boolean }) => <button disabled={disabled}>{label}</button>;`,
      filename: 'test.tsx',
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const Button = (props: { label: string; disabled?: boolean }) => { const { label, disabled } = props; return <button disabled={disabled}>{label}</button>; };`,
    },
    {
      code: `const DataRenderer = ({
  items: { name, type, status, metadata, settings, config, state: currentState, primary, secondary, tertiary },
  showDetails = false,
}: DataRendererProps) => { return <div />; }`,
      filename: 'test.tsx',
      errors: [{ messageId: 'noDestructuringInParams' }],
      output: `const DataRenderer = (props: DataRendererProps) => { const {
  items: { name, type, status, metadata, settings, config, state: currentState, primary, secondary, tertiary },
  showDetails = false,
} = props; return <div />; }`,
    },
    {
      code: `const TableColumn = ({ field, options }: TableColumnProps) => ({
  field,
  resizable: false,
  renderCell: (params) => RenderCell(params, options),
});`,
      filename: 'test.tsx',
      errors: [{ messageId: 'noDestructuringInParams' }],
      // autofix is not available for this case
    },
  ],
});

console.info('All tests passed.');
