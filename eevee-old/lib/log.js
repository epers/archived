'use strict';

// stole this from totodile

const { createLogger, format, transports } = require('winston');
const { colorize, combine, timestamp, simple } = format;

module.exports = {
  logger: function(consoleLevel, fileLevel, moduleName) {
    const log = new createLogger({
      transports: [
        new transports.File({
          filename: `${process.cwd()}/log/${moduleName}.log`,
          format: combine(
            simple(),
            timestamp({
              format: 'mm:ss',
            }),
            format.printf((info) => `${info.timestamp}  ${`[${process.pid}]`} ${`[${info.level}]`} ${`[${moduleName}]`} ${info.message}`)
          ),
          level: fileLevel,
        }),
        new transports.Console({
          format: combine(
            colorize(),
            simple(),
            timestamp({
              format: 'mm:ss',
            }),
            format.printf((info) => `${info.timestamp}  ${`[${process.pid}]`.padStart(5)} ${`[${info.level}]`.padEnd(19)} ${`[${moduleName}]`.padEnd(10)} ${info.message}`)
          ),
          level: consoleLevel,
        }),
      ],
    });
    return log;
  }
};
