const ipc = require("node-ipc");

const moduleIdent = "dummy"

var config = require(`${process.cwd()}/lib/config.lib.js`).loadConfig(moduleIdent);

// setup logging
const logger = new require(`${process.cwd()}/lib/log.lib.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);

logger.debug(`Dummy config = ${JSON.stringify(config, null, 2)}`);

require(`${process.cwd()}/lib/ipc.lib.js`).connect(config, moduleIdent);

// once we're connected, do all this stuff
ipc.of.core.on("connect", function() {
  logger.debug(`Module ${moduleIdent} connected to core`);
  // tell core that we"re ready
  process.send({
    type: "status",
    status: "connected"
  });

  ipc.of.core.emit("_subscribe", {
    moduleIdent: moduleIdent,
    events: ["dummy"] // we're pretending to be a irc server connection
  });
  // when we hear our event
  ipc.of.core.on("dummy", function(data) {
    logger.debug("I'm a BIG DUMMY");
    if (ipc.of.core) {
      ipc.of.core.emit("_outgoingMessage", {
        platform: data.platform,
        server: data.server,
        channel: data.channel,
        fromModule: moduleIdent,
        toModule: data.fromModule,
        message: "I'm a BIG DUMMY",
        timestamp: Date.now(),
        event: `${data.platform}%${data.server}%${data.channel}`
      });
    }
  });

  // // for testing, emit a echo command after 4 seconds
  // setTimeout(function() {
  //   ipc.of.core.emit("incomingMessage", {
  //     platform: "irc",
  //     server: "irc.wetfish.net",
  //     fromNick: "Weazzy",
  //     channel: "#botspam",
  //     fromModule: moduleIdent,
  //     toModule: null,
  //     message: "<echo My name is DUMMY and I AM ready! - ROUND 1",
  //     event: "echo",
  //     args: ["My name is DUMMY and I AM ready! - ROUND 1"],
  //     timestamp: Date.now()
  //   });
  // }, 4000);
  //
  // // for testing, emit a echo command after 8 seconds
  // // this one should be dropped
  // setTimeout(function() {
  //   ipc.of.core.emit("UN_subscribe", {
  //     fromModule: moduleIdent,
  //     events: ['irc%irc.wetfish.net%#botspam'] // we're pretending to be a irc server connection
  //   });
  // }, 8000);
  //
  // // for testing, emit a echo command after 12 seconds
  // setTimeout(function() {
  //   ipc.of.core.emit("incomingMessage", {
  //     platform: "irc",
  //     server: "irc.wetfish.net",
  //     fromNick: "Weazzy",
  //     channel: "#botspam",
  //     fromModule: moduleIdent,
  //     toModule: null,
  //     message: "<echo My name is DUMMY and I AM ready! - ROUND 3",
  //     event: "echo",
  //     args: ["My name is DUMMY and I AM ready! - ROUND 3"],
  //     timestamp: Date.now()
  //   });
  // }, 12000);
});

logger.silly("I'm a dummy!");

// when core tells us to exit
// core handles cleaning up our subscriptions
process.on("SIGTERM", function() {
  logger.warn("Caught SIGTERM, exiting.");
  ipc.disconnect("core");
  process.exitCode = 0; // let nodejs exit clean after the ipc is disconnected
});
