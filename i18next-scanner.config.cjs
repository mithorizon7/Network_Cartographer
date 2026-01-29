module.exports = {
  input: ["client/src/**/*.{ts,tsx}"],
  output: "./",
  options: {
    debug: false,
    sort: false,
    removeUnusedKeys: false,
    func: {
      list: ["t", "i18n.t"],
    },
    lngs: ["en"],
    ns: ["translation"],
    defaultNs: "translation",
    keySeparator: ".",
    nsSeparator: ":",
    defaultValue: (lng, ns, key) => key,
    resource: {
      loadPath: "client/src/i18n/locales/{{lng}}.json",
      savePath: "client/src/i18n/locales/{{lng}}.json",
      jsonIndent: 2,
    },
  },
};
