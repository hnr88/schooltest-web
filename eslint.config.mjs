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
      // The static design export is a read-only reference asset, not app source.
      // Its bundled support.js/image-slot.js are third-party viewer scripts that
      // trip react/no-deprecated and no-assign-module-variable.
      'dashbaord-design/**',
      '.qa/**',
    ],
  },
  ...next,
  eslintConfigPrettier,
];

export default eslintConfig;
