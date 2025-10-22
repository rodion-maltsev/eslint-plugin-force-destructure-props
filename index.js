module.exports = {
  rules: {
    'force-destructure-props': require('./src/lib/force-destructure-props'),
  },
  configs: {
    recommended: {
      plugins: ['force-destructure-props'],
      rules: {
        'force-destructure-props/force-destructure-props': 'error',
      },
    },
  },
};
