const {
  createLogger,
  format,
  transports
} = require('winston');

module.exports = {
  logger: function(consoleLevel, fileLevel, moduleName) {
    const log = createLogger({
      transports: [
        new transports.File({
          filename: `${process.cwd()}/log/${moduleName}.log`,
          format: format.combine(
            format.simple(),
            format.padLevels(),
            format.timestamp({
              format: 'mm:ss',
            }),
            format.printf(info => `${info.timestamp} ${moduleName}[${process.pid}][${info.level}] ${info.message}`)
          ),
          level: fileLevel,
        }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.padLevels(),
            format.timestamp({
              format: 'mm:ss',
            }),
            format.printf(info => `${info.timestamp} ${moduleName}[${process.pid}][${info.level}] ${info.message}`)
          ),
          level: consoleLevel,
        }),
      ],
    });
    return log;
  },
}
