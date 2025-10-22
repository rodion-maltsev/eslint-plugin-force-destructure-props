const { RuleTester } = require('eslint');
const rule = require('../lib/force-destructure-props');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    parser: require('@typescript-eslint/parser'),
  },
});

ruleTester.run('force-destructure-props', rule, {
  valid: [
    // Regular functions (not React components)
    {
      code: 'function regularFunction({ param1, param2 }) { return param1 + param2; }',
    },
    {
      code: 'const regularFunction = ({ param1, param2 }) => param1 + param2;',
    },
    // Callback functions (not React components)
    {
      code: `
        const MyComponent = () => {
          const mutation = useAgentAssignAgent(({ id, assigneeId }) => ({
            clientCompanyId: id,
            requestBody: { agentId: assigneeId },
          }));
          return <div>Component</div>;
        };
      `,
    },
    // React components with props parameter (valid)
    {
      code: `
        function MyComponent(props) {
          const { name, age } = props;
          return <div>{name} is {age} years old</div>;
        }
      `,
    },
    {
      code: `
        const MyComponent = (props) => {
          const { name, age } = props;
          return <div>{name} is {age} years old</div>;
        };
      `,
    },
    {
      code: `
        const MyComponent = props => {
          const { name, age } = props;
          return <div>{name} is {age} years old</div>;
        };
      `,
    },
    // React components with typed props
    {
      code: `
        function MyComponent(props: Props) {
          const { name, age } = props;
          return <div>{name} is {age} years old</div>;
        }
      `,
    },
    {
      code: `
        const MyComponent = (props: Props) => {
          const { name, age } = props;
          return <div>{name} is {age} years old</div>;
        };
      `,
    },
    // Components with multiple parameters
    {
      code: `
        function MyComponent(props, ref) {
          const { name } = props;
          return <div ref={ref}>{name}</div>;
        }
      `,
    },
    // Components without JSX
    {
      code: 'function NotAComponent({ param }) { return param; }',
    },
    // Non-component functions starting with lowercase
    {
      code: 'const myFunction = ({ param }) => console.log(param);',
    },
    // Arrow functions without block statement but no destructuring
    {
      code: 'const MyComponent = props => <div>{props.name}</div>;',
    },

    // Non-React callback functions in object properties
    {
      code: `
        const config = {
          mutation: useAgentAssignAgent(({ id, assigneeId }) => ({
            clientCompanyId: id,
            requestBody: { agentId: assigneeId },
          })),
          getIdFromRow: useCallback((row) => row['clientCompanyId'], []),
        };
      `,
    },

    // Controller render prop - allowed destructuring
    {
      code: `
        <Controller
          name="password"
          control={control}
          render={({ field: { value, onChange }, fieldState: { invalid, error } }) => (
            <TextFieldWrapped
              value={value}
              onChange={onChange}
              type='password'
              label='New password'
              error={invalid}
              hint={invalid ? error?.message : 'Password hint'}
            />
          )}
        />
      `,
    },

    // Field children render prop - allowed destructuring
    {
      code: `
        <Field name="username">
          {({ field, form, meta }) => (
            <div>
              <input type="text" {...field} placeholder="Username" />
              {meta.touched && meta.error && <div className="error">{meta.error}</div>}
            </div>
          )}
        </Field>
      `,
    },
  ],
  invalid: [
    // Function declaration with destructuring
    {
      code: `
        function MyComponent({ name, age }) {
          return <div>{name} is {age} years old</div>;
        }
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        function MyComponent(props) {
          const { name, age } = props;
          return <div>{name} is {age} years old</div>;
        }
      `,
    },

    // Arrow function with block statement
    {
      code: `
        const MyComponent = ({ name, age }) => {
          return <div>{name} is {age} years old</div>;
        };
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = (props) => {
          const { name, age } = props;
          return <div>{name} is {age} years old</div>;
        };
      `,
    },

    // Arrow function without block statement
    {
      code: 'const MyComponent = ({ name }) => <div>{name}</div>;',
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: 'const MyComponent = (props) => { const { name } = props; return <div>{name}</div>; };',
    },

    // Component with TypeScript type annotation
    {
      code: `
        function MyComponent({ name, age }: Props) {
          return <div>{name} is {age} years old</div>;
        }
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        function MyComponent(props: Props) {
          const { name, age } = props;
          return <div>{name} is {age} years old</div>;
        }
      `,
    },

    // Arrow function with TypeScript type annotation
    {
      code: `
        const MyComponent = ({ name, age }: Props) => {
          return <div>{name} is {age} years old</div>;
        };
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = (props: Props) => {
          const { name, age } = props;
          return <div>{name} is {age} years old</div>;
        };
      `,
    },

    // Arrow function without block and with type annotation
    {
      code: 'const MyComponent = ({ name }: Props) => <div>{name}</div>;',
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: 'const MyComponent = (props: Props) => { const { name } = props; return <div>{name}</div>; };',
    },

    // Complex destructuring
    {
      code: `
        const MyComponent = ({ user: { name, age }, isVisible = true }) => {
          return isVisible ? <div>{name} is {age}</div> : null;
        };
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = (props) => {
          const { user: { name, age }, isVisible = true } = props;
          return isVisible ? <div>{name} is {age}</div> : null;
        };
      `,
    },

    // Destructuring with default values
    {
      code: `
        function MyComponent({ name = 'Anonymous', age = 0 }) {
          return <div>{name} is {age} years old</div>;
        }
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        function MyComponent(props) {
          const { name = 'Anonymous', age = 0 } = props;
          return <div>{name} is {age} years old</div>;
        }
      `,
    },

    // Cases where autofix is enabled for memo wrapper
    {
      code: `
        const MyComponent = memo(({ name }) => {
          return <div>{name}</div>;
        });
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = memo((props) => {
          const { name } = props;
          return <div>{name}</div>;
        });
      `,
    },

    // Cases where autofix is enabled for React.memo wrapper
    {
      code: `
        const MyComponent = React.memo(({ name }) => {
          return <div>{name}</div>;
        });
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = React.memo((props) => {
          const { name } = props;
          return <div>{name}</div>;
        });
      `,
    },

    // Cases where autofix is enabled for forwardRef wrapper
    {
      code: `
        const MyComponent = forwardRef(({ name }, ref) => {
          return <div ref={ref}>{name}</div>;
        });
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = forwardRef((props, ref) => {
          const { name } = props;
          return <div ref={ref}>{name}</div>;
        });
      `,
    },

    // Cases where autofix is enabled for React.forwardRef wrapper
    {
      code: `
        const MyComponent = React.forwardRef(({ name }, ref) => {
          return <div ref={ref}>{name}</div>;
        });
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = React.forwardRef((props, ref) => {
          const { name } = props;
          return <div ref={ref}>{name}</div>;
        });
      `,
    },

    // Cases where autofix is disabled - arrow function with parentheses around body
    {
      code: 'const MyComponent = ({ name }) => ({ children: <div>{name}</div> });',
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      // No output - autofix disabled for this pattern
    },

    // Nested object destructuring
    {
      code: `
        const MyComponent = ({ config: { theme, locale } }) => {
          return <div className={theme}>{locale}</div>;
        };
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = (props) => {
          const { config: { theme, locale } } = props;
          return <div className={theme}>{locale}</div>;
        };
      `,
    },

    // Rest parameters in destructuring
    {
      code: `
        function MyComponent({ name, ...restProps }) {
          return <div {...restProps}>{name}</div>;
        }
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        function MyComponent(props) {
          const { name, ...restProps } = props;
          return <div {...restProps}>{name}</div>;
        }
      `,
    },

    // Renamed properties in destructuring
    {
      code: `
        const MyComponent = ({ name: displayName, age: userAge }) => {
          return <div>{displayName} is {userAge}</div>;
        };
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = (props) => {
          const { name: displayName, age: userAge } = props;
          return <div>{displayName} is {userAge}</div>;
        };
      `,
    },

    // Component with complex JSX
    {
      code: `
        function ComplexComponent({ items, onItemClick, selectedId }) {
          return (
            <ul>
              {items.map(item => (
                <li
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className={item.id === selectedId ? 'selected' : ''}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          );
        }
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        function ComplexComponent(props) {
          const { items, onItemClick, selectedId } = props;
          return (
            <ul>
              {items.map(item => (
                <li
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className={item.id === selectedId ? 'selected' : ''}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          );
        }
      `,
    },

    // Arrow function with multi-line JSX in parentheses
    {
      code: `
        const MyComponent = ({ title, subtitle }) => (
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        );
      `,
      errors: [
        {
          messageId: 'noDestructuringInParams',
          type: 'ObjectPattern',
        },
      ],
      output: `
        const MyComponent = (props) => {
          const { title, subtitle } = props;
          return (
            <div>
                        <h1>{title}</h1>
                        <p>{subtitle}</p>
                      </div>
          );
        };
      `,
    },
  ],
});

console.log('All tests passed');
