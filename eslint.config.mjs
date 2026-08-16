import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/**
 * Flat config. eslint-config-next@16 ships flat config arrays directly, so this
 * needs no FlatCompat and no extra dependency.
 *
 * Rules that would fail the build across the existing codebase are set to warn,
 * not off — they stay visible without blocking `npm run verify`. Correctness and
 * accessibility rules stay at error.
 */
export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
      'supabase/**',
      '.agents/**',
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    rules: {
      // Pre-existing debt across route handlers and mappers. Surfaced, not enforced yet.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],

      // Raw <img> is being removed with the card redesign; warn until then.
      '@next/next/no-img-element': 'warn',

      // These protect real behaviour — keep them failing the build.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Fires on the `useEffect(() => fetchX().then(setX), [])` pattern in
      // app/page.tsx, app/browse/page.tsx and app/admin/page.tsx. The real fix is
      // moving those fetches to server components, which is the C4 redesign step —
      // not something to paper over with a ref. Warn until then.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
