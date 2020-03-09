'use strict';

const fs = require('fs');

module.exports = {
  config: function(moduleIdent, configFileOverride) {
    try {
      if (configFileOverride) {
        const path = `${process.cwd()}/etc/${configFileOverride}.js`;
        fs.accessSync(path, fs.constants.R_OK);
        const config = require(path);
        return config;
      } else {
        const path = `${process.cwd()}/etc/${moduleIdent}.js`;
        fs.accessSync(path, fs.constants.R_OK);
        const config = require(`${process.cwd()}/etc/${moduleIdent}.js`);
        return config;
      }
    } catch (err) {
      const config = {
        'consoleLogLevel': 'error',
        'fileLogLevel': 'error'
      };
      return config;
    }
  }
};
