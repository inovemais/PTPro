  module.exports = {
    root: true,
    extends: [
      'plugin:import/typescript',
      'plugin:testing-library/react',
      // prettier should be the last extension in the list
      // https://github.com/prettier/eslint-plugin-prettier#recommended-configuration
      'plugin:prettier/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2018,
      requireConfigFile: false,
      sourceType: 'module',
    },
    env: {
      browser: true,
      es6: true,
    },
    rules: {
      'react/jsx-filename-extension': [
        ERROR,
        { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      ],
      'arrow-parens': OFF,
      'implicit-arrow-linebreak': OFF,
      'import/extensions': [
        ERROR,
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'import/no-unresolved': [ERROR, { caseSensitive: false }],
      'object-curly-newline': OFF,
      'operator-linebreak': OFF,
      'prettier/prettier': [ERROR, { singleQuote: true, trailingComma: 'all' }],
      'formatjs/enforce-id': [ERROR],
      'formatjs/enforce-default-message': [ERROR, 'literal'],
      'formatjs/enforce-placeholders': [ERROR],
      'formatjs/no-literal-string-in-jsx': [ERROR],
      'react/jsx-uses-react': OFF,
      'react/react-in-jsx-scope': OFF,
    },
    overrides: [
      {
        files: ['src/scripts/**'],
        env: {
          node: true,
        },
      },
      {
        files: ['**.test.**', '**.spec.**', '**.cy.**'],
        env: {
          node: true,
        },
        rules: {
          '@typescript-eslint/no-non-null-assertion': OFF,
          'formatjs/no-literal-string-in-jsx': OFF,
          'testing-library/no-node-access': [
            ERROR,
            { allowContainerFirstChild: true },
          ],
        },
      },
      {
        files: ['*.{ts,tsx}'],
        extends: [],
        parserOptions: {
          project: [
            './tsconfig.json',
            './cypress/tsconfig.json',
            'vite.config.ts',
          ],
        },
        rules: {
          'react/require-default-props': OFF,
          '@typescript-eslint/naming-convention': OFF,
          '@typescript-eslint/no-use-before-define': [WARN, { functions: false }],
          'no-restricted-imports': [
            ERROR,
            {
              patterns: [
                {
                  group: [
                    'css-vars-ponyfill',
                    'date-fns',
                    'lodash/*',
                    'mitm',
                    'msw',
                    'query-string',
                    'react-helmet',
                    'react-inlinesvg',
                    'react-intl',
                    'react-redux',
                    'react-router-dom',
                    'redux-logger',
                    'redux-promise-middleware',
                    'redux-thunk',
                    'yup',
                    '!src/lib/**/*',
                  ],
                  message: "Import { [module] } from 'src/lib/[package]' instead",
                },
                {
                  group: [
                    '@testing-library/*',
                    '!@testing-library/react-hooks',
                    '!@testing-library/user-event',
                    '!src/lib/testing-library/*',
                  ],
                  message:
                    "Import { [module] } from 'src/lib/testing-library' instead",
                },
                {
                  group: [
                    '@testing-library/react-hooks',
                    '!src/lib/testing-library/*',
                  ],
                  message:
                    "Import { actHook, renderHook } from 'src/lib/testing-library' instead",
                },
                {
                  group: [
                    '@testing-library/user-event',
                    '!src/lib/testing-library/*',
                  ],
                  message:
                    "Import { userEvent } from 'src/lib/testing-library' instead",
                },
                {
                  group: ['react-select-event*', '!src/lib/testing-library/*'],
                  message:
                    "Import { selectEvent } from 'src/lib/testing-library' instead",
                },
              ],
            },
          ],
        },
      },
      {
        files: ['src/lib/**/*', 'setupTests.ts'],
        rules: {
          'import/no-extraneous-dependencies': OFF,
          'no-restricted-imports': OFF,
        },
      },
      {
        files: [
          'cypress/**',
          '.eslintrc.js',
          'test-utils.tsx',
          'setupTests.ts',
          'cypress.config.ts',
          '**/mocks/**',
          'src/lib/testing-library/**',
          'vite.config.ts',
        ],
        rules: {
          'import/no-extraneous-dependencies': [ERROR, { devDependencies: true }],
        },
      },
      {
        files: [
          'cypress.config.ts',
          'cypress/**/*.js',
          'cypress/**/*.ts',
          'cypress/**/*.tsx',
        ],
        env: {
          'cypress/globals': true,
        },
        plugins: ['cypress'],
        rules: {
          'testing-library/await-async-queries': OFF,
          'testing-library/prefer-screen-queries': OFF,
        },
      },
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
  };
  