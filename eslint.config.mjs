import next from 'eslint-config-next';
import eslintConfigPrettier from 'eslint-config-prettier';

// eslint-config-next v16 ships a native flat config array, so it is spread
// directly — FlatCompat is intentionally avoided (its eslintrc validator
// cannot serialize the bundled react plugin's circular config).
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'next-env.d.ts',
      // shadcn/Base UI primitives are vendored and must never be edited/linted.
      'src/components/ui/**',
    ],
  },
  ...next,
  eslintConfigPrettier,
];

export default eslintConfig;
