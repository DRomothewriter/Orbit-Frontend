import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import pluginSecurity from 'eslint-plugin-security';

export default tseslint.config(
  {
    files: ['src/**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      pluginSecurity.configs.recommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Core JS/DOM security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-restricted-properties': [
        'error',
        {
          property: 'innerHTML',
          message: 'Avoid direct innerHTML assignment (XSS risk). Use Angular templates or safe DOM APIs.',
        },
        {
          property: 'outerHTML',
          message: 'Avoid direct outerHTML assignment (XSS risk).',
        },
        {
          property: 'bypassSecurityTrustHtml',
          message: 'Avoid DomSanitizer.bypassSecurityTrustHtml unless strictly reviewed and sanitized.',
        },
        {
          property: 'bypassSecurityTrustScript',
          message: 'Avoid DomSanitizer.bypassSecurityTrustScript (critical XSS risk).',
        },
        {
          object: 'document',
          property: 'write',
          message: 'Avoid document.write (XSS risk).',
        },
        {
          object: 'document',
          property: 'writeln',
          message: 'Avoid document.writeln (XSS risk).',
        },
      ],
      // Suppress non-security style/lint noise so lint:security focuses strictly on security
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@angular-eslint/no-empty-lifecycle-method': 'off',
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/no-output-on-prefix': 'off',
      '@angular-eslint/no-output-native': 'off',
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
    ],
    rules: {},
  }
);
