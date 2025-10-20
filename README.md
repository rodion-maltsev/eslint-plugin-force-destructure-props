# eslint-plugin-force-destructure-props

ESLint rule that prohibits destructuring of props in a component signature.

## Example

❌ Incorrect code:
```js
export const Component = ({ title, id }) => { 
  // component code 
}
```

✅ Correct code:
```js
export const Component = (props) => {
  const { title, id } = props;
  
  // component code
}
```