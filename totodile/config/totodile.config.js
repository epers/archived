module.exports = {
  /* Available verbosity and log levels:
      error,
      warn,
      info,
      verbose,
      debug,
      silly
  */
  logLevel: 'info',
  consoleLogLevel: 'silly',
  ipcDebug: false,
  commandPrefix: '<',
  ipcPort: 34356,
  initModules: ['messageRouter', 'echo', 'irc', 'admin'],
  adminNick: "Weazzy"
}
