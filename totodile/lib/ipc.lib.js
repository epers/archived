module.exports = {
  connect: function(config, moduleIdent) {
    // setup logging
    const logger = new require(`${process.cwd()}/lib/log.lib.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
    // setup our sockets
    const ipc = require("node-ipc");
    ipc.config.silent = !(config.ipcDebug);
    ipc.config.maxRetries = 10;
    ipc.logger = logger.debug;
    // connect to core
    ipc.connectToNet("core", config.ipcPort);
  },
  serve: function(config, moduleIdent) {
    // setup logging
    const logger = new require(`${process.cwd()}/lib/log.lib.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
    // setup our sockets
    const ipc = require("node-ipc");
    // configure our listening socket
    ipc.config.silent = !(config.ipcDebug);
    ipc.config.maxRetries = 10;
    ipc.logger = logger.debug;

    // setup our socket
    ipc.serveNet(config.ipcPort);
    // serve our socket
    ipc.server.start();
  }
}
