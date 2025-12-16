const fs = require('fs');
const path = require('path');

module.exports = {
  input: [
    'client/src/**/*.{ts,tsx}',
    '!client/src/**/*.test.{ts,tsx}',
    '!**/node_modules/**',
  ],
  output: './',
  options: {
    debug: false,
    removeUnusedKeys: false,
    sort: true,
    func: {
      list: ['t', 'i18next.t', 'i18n.t'],
      extensions: ['.ts', '.tsx'],
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.tsx'],
      fallbackKey: false,
    },
    lngs: ['en', 'lv', 'ru'],
    defaultLng: 'en',
    defaultNs: 'translation',
    defaultValue: (lng, ns, key) => {
      if (lng === 'en') {
        return key;
      }
      return '';
    },
    resource: {
      loadPath: 'client/src/i18n/locales/{{lng}}.json',
      savePath: 'client/src/i18n/locales/{{lng}}.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    nsSeparator: ':',
    keySeparator: '.',
    interpolation: {
      prefix: '{{',
      suffix: '}}',
    },
  },
};
