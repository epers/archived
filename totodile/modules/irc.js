const ipc = require("node-ipc");
const EventEmitter = require("eventemitter3");

// setup event emitters
class eventEmitter extends EventEmitter {}

// fs = require("fs");
const fork = require("child_process").fork;

const moduleIdent = "irc"

var config = require(`${process.cwd()}/lib/config.lib.js`).loadConfig(moduleIdent);

// setup logging
const logger = new require(`${process.cwd()}/lib/log.lib.js`).logger(config.consoleLogLevel, config.logLevel, moduleIdent);

logger.debug(`${moduleIdent} config = ${JSON.stringify(config, null, 2)}`);

// connect to core
require(`${process.cwd()}/lib/ipc.lib.js`).connect(config, moduleIdent);

// setup a eventemitter to handle messages to/from worker processes
const controlEvent = new eventEmitter();

// keep track of our children here
const ircWorkers = {};

// keep track of server objects
const servers = {};

// come back here and build an list of platform%server%channel entries
// also add an event for control messages from core
const allEvents = [];


function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key))
      return false;
  }
  return true;
}


ipc.of.core.on("connect", function() {
  logger.debug(`Module ${moduleIdent} connected to core`);
  logger.silly("Kickin it 80's style I see");

  // tell core that we're connected
  process.send({
    type: "status",
    status: "connected"
  });

  // _subscribe to control messages
  ipc.of.core.emit("_subscribe", {
    fromModule: moduleIdent,
    events: ["IRC"] // we"re an irc server connection
  });

  // when we receive a control message
  ipc.of.core.on("IRC", function(data) {
    controlEvent.emit(data.command, data);
  });

  // iterate over the list of servers we're supposed to connect to
  // and connect to them
  config.connections.forEach(function(connection) {
    // returns a array of platform%server%channel strings
    serverConnect(connection).then(function(connectedEvents) {
      logger.debug(`Subscribing to: [${connectedEvents}]`);
      ipc.of.core.emit("_subscribe", {
        fromModule: moduleIdent,
        events: connectedEvents // we"re pretending to be a irc server connection
      });
      // iterate over array of platform%server%channel strings
      connectedEvents.forEach(function(connectedEvent) {
        // listen for messages from core to servers
        ipc.of.core.on(connectedEvent, function(data) {
          // route it to the proper child process
          logger.debug(`Outgoing message to [${data.channel}] on server [${data.server}]:\n${JSON.stringify(data, null, 2)}`);
          ircWorkers[data.server].send({
            type: "outgoingMessage",
            data: data
          });
        });
      });
    });
  });
});


// when we hear a control event for disconnect
controlEvent.on("SERVERDISCONNECT", serverDisconnect);
// give it a disconnect object, it disconnects and kills those workers
function serverDisconnect(data) {
  return new Promise(function(resolve) {
    // if there were args to the command
    if (!isEmpty(data.args)) {
      // iterate over them
      data.args.forEach(function(server) {
        // if the arg is valid
        if (ircWorkers[server]) {
          // kill it nicely
          logger.debug(`Killing worker: ${ircWorkers[server].pid}`);
          ircWorkers[server].kill("SIGTERM");
          delete servers[data.server];
          delete ircWorkers[server];
          resolve(true);
        }
      });
    } else {
      if (ircWorkers[data.server]) {
        logger.debug(`Killing worker: ${ircWorkers[data.server].pid}`);
        ircWorkers[data.server].kill("SIGTERM");
        delete servers[data.server];
        delete ircWorkers[data.server];
        resolve(true);
      }
    }
  });
}


// when we hear a control event for connect
controlEvent.on("SERVERCONNECT", function(connection) {
  serverConnect(connection).then(function(connectedEvents) {
    logger.debug(`Subscribing to: [${connectedEvents}]`);
    ipc.of.core.emit("_subscribe", {
      fromModule: moduleIdent,
      events: connectedEvents // we"re pretending to be a irc server connection
    });
    // iterate over array of platform%server%channel strings
    connectedEvents.forEach(function(connectedEvent) {
      // listen for messages from core to servers
      ipc.of.core.on(connectedEvent, function(data) {
        // route it to the proper child process
        logger.debug(`Outgoing message to [${data.channel}] on server [${data.server}]:\n${JSON.stringify(data, null, 2)}`);
        ircWorkers[data.server].send({
          type: "outgoingMessage",
          data: data
        });
      });
    });
  });
});
// give a connection object, it spawns a worker and connects
function serverConnect(connection) {
  return new Promise(function(resolve) {
    var result = []
    logger.info(`Connecting to [${connection.server}]`);
    //
    const childPath = `${process.cwd()}/lib/ircWorker.lib.js`
    if (!ircWorkers[connection.server]) {
      ircWorkers[connection.server] = {}
    }
    var child = fork(childPath, [], ["pipe", "pipe", "pipe", "ipc"]);
    ircWorkers[connection.server] = child
    ircWorkers[connection.server].send({
      type: "CONNECT",
      connection: connection
    });

    ircWorkers[connection.server].on("message", function(data) {
      if (data.type === "incomingMessage") {
        logger.debug(`Message received from worker on server ${connection.server}:\n${JSON.stringify(data, null, 2)}`);
        //messageEvent.emit("incomingMessage", data);
        ipc.of.core.emit("incomingMessage", data.data);
      } else if (data.type === "status") {
        if (data.status === "registered") {
          ircWorkers[connection.server].send({
            type: "join",
            channels: connection.channels
          });
        }
      }
    });

    // build the list of events to listen to
    connection.channels.forEach(function(channel) {
      if (allEvents.includes(`IRC%${connection.server}%${channel}`) === false) { // prevent dupes
        allEvents.push(`IRC%${connection.server}%${channel}`);
      }
      if (result.includes(`IRC%${connection.server}%${channel}`) === false) {
        result.push(`IRC%${connection.server}%${channel}`);
      }
    });

    servers[connection.server] = connection;

    resolve(result);
  });
}


// when we hear a control event for disconnect
controlEvent.on("SERVERRECONNECT", serverReconnect);
// reconnects to a given server
function serverReconnect(data) {
  var connection = servers[data.server];
  serverDisconnect(data).then(function(result) {
    if (result === true) {
      serverConnect(connection);
    }
  });
}

controlEvent.on("JOINCHANNEL", joinChannel);
// joins a given server
function joinChannel(data) {
  logger.debug(JSON.stringify(data, null, 2));
  ircWorkers[data.server].send({
    type: "JOIN",
    channels: data.channels
  });
  data.channels.forEach(function(channel) {
    if (allEvents.includes(`IRC%${data.server}%${channel}`) === false) {
      var event = `IRC%${data.server}%${channel}`
      ipc.of.core.emit("_subscribe", {
        fromModule: moduleIdent,
        events: [event]
      });
      ipc.of.core.on(event, outgoingMessageHandler);
      allEvents.push(`IRC%${data.server}%${data.channel}`);
      logger.debug(JSON.stringify(allEvents, null, 2));
    }
  });
}

controlEvent.on("PARTCHANNEL", partChannel);

function partChannel(data) {
  logger.debug(JSON.stringify(data, null, 2));
  // TODO come back later and set it up to allow passing channels in arguments. Same for joinChannel as well
  data.channels.forEach(function(channel) {
    // build list of events
    if (allEvents.includes(`IRC%${data.server}%${channel}`) === true) {
      var event = `IRC%${data.server}%${channel}`
      ircWorkers[data.server].send({
        type: "PART",
        channels: channel
      });
      ipc.of.core.emit("_unsubscribe", {
        fromModule: moduleIdent,
        events: [event]
      });
      ipc.of.core.removeListener(event, outgoingMessageHandler);

      for (var i = 0; i < allEvents.length - 1; i++) {
        if (allEvents[i] === `IRC%${data.server}%${channel}`) {
          allEvents.splice(i, 1);
        }
      }

      allEvents.push(`IRC%${data.server}%${data.channel}`);
      logger.debug(JSON.stringify(allEvents, null, 2));
    }
  });
}


function outgoingMessageHandler(data) {
  logger.debug(`Outgoing message to [${data.channel}] on server [${data.server}]:\n${JSON.stringify(data, null, 2)}`);
  ircWorkers[data.server].send({
    type: "outgoingMessage",
    data: data
  });
}
// when core tells us to exit
// core handles cleaning up our subscriptions
process.on("SIGTERM", function() {
  logger.warn("Caught SIGTERM, exiting.");

  Object.keys(ircWorkers).forEach(function(worker) {
    logger.debug(`Killing worker: ${ircWorkers[worker].pid}`);
    ircWorkers[worker].kill("SIGTERM");
    delete servers[worker];
    delete ircWorkers[worker];
    controlEvent.removeAllListeners();
  });
  ipc.disconnect("core");
  process.exitCode = 0; // let nodejs exit clean after the ipc is disconnected
});
