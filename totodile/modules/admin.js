// admin module
// injests admin commands
// outputs control messages
const EventEmitter = require("eventemitter3");
class eventEmitter extends EventEmitter {}
const messageEvent = new eventEmitter();

// list of events that we want to hear
const events = ["admin"] // array of events this module will listen to

// bring in the ipc lib
const ipc = require("node-ipc");

// set our identifier
const moduleIdent = "admin";

// load up our config
var config = require(`${process.cwd()}/lib/config.lib.js`).loadConfig(moduleIdent);

// setup logging
const logger = new require(`${process.cwd()}/lib/log.lib.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);

// debug log our config
logger.debug(`[${moduleIdent}] config:\n${JSON.stringify(config, null, 2)}`);

// connect to the core process
require(`${process.cwd()}/lib/ipc.lib.js`).connect(config, moduleIdent);

// check to see if the user is an admin
function isAdmin(data) {
  if (data.fromNick === config.adminNick) {
    return true;
  } else {
    return false;
  }
}

// once we're connected
ipc.of.core.on("connect", function() {
  logger.debug(`Module [${moduleIdent}] connected to core`);
  logger.silly("I'm the boss here");

  // and now we tell loadModule that we're connected
  process.send({
    type: "status",
    status: "connected"
  });

  // send out a _subscribe
  ipc.of.core.emit("_subscribe", {
    fromModule: moduleIdent,
    events: events,
    commandPrefix: config.commandPrefix
  });

  ipc.of.core.on("admin", function(data) {
    if(isAdmin(data)) {
      messageEvent.emit(data.args[0], data);
    }
  });


  // when we hear our commands from core
  messageEvent.on("join", function(data) {
    logger.debug(`Join message: ${JSON.stringify(data, null, 2)}`);
    ipc.of.core.emit("outgoingMessage", {
      platform: data.platform,
      server: data.server,
      channel: data.channel,
      fromModule: moduleIdent,
      toModule: data.fromModule,
      message: data.args.join(" "),
      timestamp: Date.now(),
      command: "JOINCHANNEL",
      event: data.platform,
      channels: data.args.slice(1)
    });
  });


  messageEvent.on("part", function(data) {
    logger.debug(`Part message: ${JSON.stringify(data, null, 2)}`);
    ipc.of.core.emit("outgoingMessage", {
      platform: data.platform,
      server: data.server,
      channel: data.channel,
      fromModule: moduleIdent,
      toModule: data.fromModule,
      message: data.args.join(" "),
      timestamp: Date.now(),
      command: "PARTCHANNEL",
      event: data.platform,
      channels: data.args.slice(1)
    });
  });


  messageEvent.on("connect", function(data) {
    logger.debug(`Connect message: ${JSON.stringify(data, null, 2)}`);
    var args = require('minimist')(data.args, {
      string: ["h", "n", "c"],
      number: ["p"],
    });

    logger.debug(JSON.stringify(args, null, 2));
    // parse out the args
    // -h irc.wetfish.net -p 6697 -s (boolean flag) -n Tododile -c #foo #bar #baz
    ipc.of.core.emit("outgoingMessage", {
      server: args.h,
      port: args.p,
      ssl: args.s,
      nick: args.n,
      autoRejoin: config.autoRejoin,
      autoReconnect: config.autoReconnect,
      channels: args.c.split(","),
      command: "SERVERCONNECT",
      args: data.args,
      event: data.platform, // route it to the control listener in the connector
      platform: data.platform,
      channel: data.channel,
      fromModule: moduleIdent,
      toModule: data.fromModule,
      message: data.message,
      timestamp: Date.now(),
    });
  });


  messageEvent.on("disconnect", function(data) {
    if (isAdmin(data)) {
      logger.debug(`Disconnect message: ${JSON.stringify(data, null, 2)}`);
      ipc.of.core.emit("outgoingMessage", {
        command: "SERVERDISCONNECT",
        args: data.args.slice(1),
        server: data.server,
        channel: data.channel,
        platform: data.platform,
        event: data.platform
      });
    }
  });


  messageEvent.on("reconnect", function(data) {
    ipc.of.core.emit("outgoingMessage", {
      command: "SERVERRECONNECT",
      args: data.args.slice(1),
      server: data.server,
      channel: data.channel,
      platform: data.platform,
      event: data.platform
    });
  });


  messageEvent.on("load", function(data) {
    if (isAdmin(data)) {
      logger.debug(`Load message: ${JSON.stringify(data, null, 2)}`);
      var modules = data.args.slice(1)
      modules.forEach(function(module) {
        ipc.of.core.emit("LOADMODULE", {
          module: module,
          server: data.server,
          channel: data.channel,
          platform: data.platform
        });
      });
    }
  });


  messageEvent.on("unload", function(data) {
    if (isAdmin(data)) {
      logger.debug(`Unload message: ${JSON.stringify(data, null, 2)}`);
      var modules = data.args.slice(1)
      modules.forEach(function(module) {
        ipc.of.core.emit("UNLOADMODULE", {
          module: module,
          server: data.server,
          channel: data.channel,
          platform: data.platform
        });
      });
    }
  });


  messageEvent.on("reload", function(data) {
    if (isAdmin(data)) {
      logger.debug(`Reload message: ${JSON.stringify(data, null, 2)}`);
      var modules = data.args.slice(1)
      modules.forEach(function(module) {
        ipc.of.core.emit("RELOADMODULE", {
          module: module,
          server: data.server,
          channel: data.channel,
          platform: data.platform
        });
      });
    }
  });
});


// when core tells us to exit
// core handles cleaning up our subscriptions
process.on("SIGTERM", function() {
  logger.warn("Caught SIGTERM, exiting.");
  ipc.disconnect("core");
  messageEvent.removeAllListeners();
  process.exitCode = 0; // let nodejs exit clean after the ipc is disconnected
});
