// list of events that we want to hear
const events = ["echo"] // array of events this module will listen to

// bring in the ipc lib
const ipc = require("node-ipc");

// set our identifier
const moduleIdent = "echo";

// load up our config
var config = require(`${process.cwd()}/lib/config.lib.js`).loadConfig(moduleIdent);

// setup logging
const logger = new require(`${process.cwd()}/lib/log.lib.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);

// debug log our config
logger.debug(`${moduleIdent} config = ${JSON.stringify(config, null, 2)}`);

// connect to the core process
require(`${process.cwd()}/lib/ipc.lib.js`).connect(config, moduleIdent);


// once we"re connected
ipc.of.core.on("connect", function() {
  logger.debug(`Module [${moduleIdent}] connected to core`);
  logger.silly("Polly want a cracker?");
  // and now we tell loadModule that we're connected
  process.send({
    type: "status",
    status: "connected"
  });
  // send out a _subscribe
  ipc.of.core.emit("_subscribe", {
    fromModule: moduleIdent,
    events: events
  });
  // when we hear our echo command from core
  ipc.of.core.on("echo", echo);
});


// echo function
function echo(data) {
  // turn it around and send it right back
  if(ipc.of.core) {
    ipc.of.core.emit("outgoingMessage", {
      platform: data.platform,
      server: data.server,
      channel: data.channel,
      //fromModule: moduleIdent,
      //toModule: data.fromModule,
      message: data.args.join(" "),
      timestamp: Date.now(),
      event: `${data.platform}%${data.server}%${data.channel}`
    });
  } else {
    logger.error('Echo function called but IPC is disconnected!');
  }
}


// when core tells us to exit
// core handles cleaning up our subscriptions
process.on("SIGTERM", function() {
  logger.warn("Caught SIGTERM, exiting.");
  ipc.disconnect("core");
  process.exitCode = 0; // let nodejs exit clean after the ipc is disconnected
});
