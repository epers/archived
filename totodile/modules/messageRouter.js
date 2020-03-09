const ipc = require("node-ipc");

const moduleIdent = "messageRouter"

var config = require(`${process.cwd()}/lib/config.lib.js`).loadConfig(moduleIdent);

// setup logging
const logger = new require(`${process.cwd()}/lib/log.lib.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);

logger.debug(`messageRouter config = ${JSON.stringify(config, null, 2)}`);

require(`${process.cwd()}/lib/ipc.lib.js`).connect(config, moduleIdent);

ipc.of.core.on("connect", function() {
  logger.debug(`Module ${moduleIdent} connected to core`);
  // tell core that we"re ready
  process.send({
    type: "status",
    status: "connected"
  });

  ipc.of.core.emit("_subscribe", {
    fromModule: moduleIdent,
    events: ["_messageRouter"]
  });

  ipc.of.core.emit("_routerUpdate");
});


ipc.of.core.on("_subscribe", function(data) {
  logger.debug(`_subscribe received:\n${JSON.stringify(data, null, 2)}`);
});

ipc.of.core.on("_messageRouter", function(data) {
  logger.debug(`_messageRouter received:\n${JSON.stringify(data, null, 2)}`);
});
