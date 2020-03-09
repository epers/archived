// this is a worker process for a single server connection
const IRCLIB = require("irc-framework");

// build the irc client
const moduleIdent = "ircWorker";
const client = new IRCLIB.Client();

// load config
var config = require(`${process.cwd()}/lib/config.lib.js`).loadConfig(moduleIdent);
// setup logging
const logger = new require(`${process.cwd()}/lib/log.lib.js`).logger(config.consoleLogLevel, config.logLevel, moduleIdent);
logger.debug(`${moduleIdent} config:\n${JSON.stringify(config, null, 2)}`);

// setup a array of channel objects
const buffers = [];

// keep track of our server here - TODO do this better
var server = null;

// listen for messages from the irc master process
process.on("message", controllerMessageHandler);
function controllerMessageHandler(data) {
  if (data.type == "CONNECT") {
    logger.debug(`CONNECT command received from parent process:\n${JSON.stringify(data, null, 2)}`);
    connect(data.connection);
    server = data.connection.server;
    // connect to the server && join those channels
  } else if (data.type == "JOIN") {
    logger.debug(`JOIN command received from parent process:\n${JSON.stringify(data, null, 2)}`);
    join(data.channels);
  } else if (data.type == "PART") {
    logger.debug(`PART command received from parent process:\n${JSON.stringify(data, null, 2)}`);
    part(data.channels);
  } else if (data.type == "outgoingMessage") {
    logger.debug(`outgoingMessage command received from parent process:\n${JSON.stringify(data, null, 2)}`);
    buffers[data.data.channel].say(data.data.message);
  }
}

client.on("registered", function() {
  process.send({
    type: "status",
    status: "registered"
  });
});

client.on("message", function(data) {
  logger.debug(JSON.stringify(data, null, 2));

  // if the first N characters match our command prefix
  if (data.message.slice(0, config.commandPrefix.length) == config.commandPrefix) {
    // parse out the command and any args to that command
    data.event = data.message.slice(config.commandPrefix.length).split(" ")[0];
    data.args = data.message.slice(config.commandPrefix.length).split(" ").slice(1);
  } else {
    data.event = null;
    data.args = null;
  }

  process.send({
    type: "incomingMessage",
    data: {
      platform: "irc",
      server: server,
      fromNick: data.nick,
      channel: data.target,
      fromModule: moduleIdent,
      message: data.message,
      event: data.event,
      args: data.args,
      timestamp: Date.now(),
      rawEvent: data
    }
  });
});

function connect(options) {
  logger.info(`Connecting to [${options.server}]`);
  client.connect({
    host: options.server,
    port: options.port,
    nick: options.nick,
    ssl: options.ssl,
    auto_reconnect: options.autoReconnect
  });
}

function join(channels) {
  channels.forEach(function(channel) {
    if (!buffers[channel]) { // prevent dupes
      logger.info(`Joining channel [${channel}]`);
      buffers[channel] = client.channel(channel);
      buffers[channel].join();
    }
  });
}

function part(channels) {
  channels.forEach(function(channel) {
    if (!buffers[channel]) { // prevent dupes
      logger.info(`Leaving channel [${channel}]`);
      buffers[channel] = client.channel(channel);
      buffers[channel].part();
    }
  });
}


// when controller tells us to exit
process.on("SIGTERM", function() {
  logger.warn("Caught SIGTERM, exiting.");
  client.quit("goodbye!");
  process.removeAllListeners("message", controllerMessageHandler);
  process.exitCode = 0; // let nodejs exit clean after the ipc is disconnected
});
