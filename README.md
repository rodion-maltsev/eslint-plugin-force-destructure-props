# eslint-plugin-force-destructure-props

ESLint rule that enforces props destructuring inside the component body instead of the parameter list.

## Installation

```bash
npm install --save-dev eslint-plugin-force-destructure-props
```

## Usage

### ESLint Flat Config (eslint.config.js)

```js
import forceDestructureProps from 'eslint-plugin-force-destructure-props';

export default [
  {
    plugins: {
      'force-destructure-props': forceDestructureProps,
    },
    rules: {
      'force-destructure-props/force-destructure-props': 'error',
    },
  },
];
```

### Legacy Config (.eslintrc.js)

```js
module.exports = {
  plugins: ['force-destructure-props'],
  rules: {
    'force-destructure-props/force-destructure-props': 'error',
  },
};
```

### Using Recommended Config

```js
// ESLint Flat Config
import forceDestructureProps from 'eslint-plugin-force-destructure-props';

export default [
  forceDestructureProps.configs.recommended,
];

// Legacy Config
module.exports = {
  extends: ['plugin:force-destructure-props/recommended'],
};
```

## Rule Details

This rule enforces that React component props should be destructured inside the component body rather than in the parameter list.

### Examples

❌ Incorrect code:
```js
export const Component = ({ title, id }) => { 
  return <div>{title}</div>;
}

function MyComponent({ value, onChange }) {
  return <input value={value} onChange={onChange} />;
}
```

✅ Correct code:
```js
export const Component = (props) => {
  const { title, id } = props;
  return <div>{title}</div>;
}

function MyComponent(props) {
  const { value, onChange } = props;
  return <input value={value} onChange={onChange} />;
}
```

### TypeScript Support

The rule correctly handles TypeScript types:

❌ Incorrect:
```tsx
const Component = ({ callback }: { callback: (id: string) => void }) => {
  return <button onClick={() => callback('test')}>Click</button>;
}
```

✅ Correct:
```tsx
const Component = (props: { callback: (id: string) => void }) => {
  const { callback } = props;
  return <button onClick={() => callback('test')}>Click</button>;
}
```

## Auto-fix

This rule provides automatic fixes for most cases. However, auto-fix is disabled for complex arrow functions that immediately return objects (e.g., `() => ({...})`) to prevent code breakage.

## Configuration

This rule has no configuration options.