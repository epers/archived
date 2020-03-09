// core of the bot
// run it with `node totodile.js`

// in true nodejs style - a huge stack of deps
//const decache = require("decache"); // "un-require" a module
const ipc = require("node-ipc");
const EventEmitter = require("eventemitter3");
const fs = require("fs");
const fork = require("child_process").fork;

// our identifier
const moduleIdent = "totodile";

var config = require(`${process.cwd()}/lib/config.lib.js`).loadConfig(moduleIdent);

// setup logging
const logger = new require(`${process.cwd()}/lib/log.lib.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);

logger.info(`initModules: ${config.initModules}`);
logger.debug(`[${moduleIdent}] config:\n${JSON.stringify(config, null, 2)}`);

// setup event emitters
class eventEmitter extends EventEmitter {}

const messageEvent = new eventEmitter();

// maintain a list of children/modules
const children = {};
const listeners = {};
const loadedModules = [];

// serve up our socket
require(`${process.cwd()}/lib/ipc.lib.js`).serve(config, moduleIdent);

// once the socket is listening, load up modules listed in config.modules
ipc.server.on("start", function() {
  logger.info("INIT: Loading modules");
  // iterate across the init module list
  config.initModules.forEach(function(moduleIdent) {
    // try to load it
    loadModule(moduleIdent).catch(function(error) {
      logger.error(error.message);
    });
  });
});


// this is run whenever a server connector sends us a message
ipc.server.on("_incomingMessage", function(data, socket) {
  // pass it on to the router
  data.type = "_incomingMessage";
  data.toModule = "messageRouter";
  //messageEvent.emit("messageRouter", data, socket);
  messageEvent.emit("_incomingMessage", data, socket);
  return 0;
});


ipc.server.on("_outgoingMessage", function(data, socket) {
  messageEvent.emit(data.toModule, data);
});


// when a module starts up, it will send a _subscribe event
// this is to register what events it wants to listen for
ipc.server.on("_subscribe", function(data, socket) {
  data.type = "_subscribe";
  data.toModule = "messageRouter";
  //logger.debug(`subscribe received from [${data.fromModule}]:\n${JSON.stringify(data, null, 2)}`);
  if (!listeners[data.fromModule]) {
    listeners[data.fromModule] = [];
  }
  data.events.forEach(function(event) {
    if (listeners[data.fromModule].includes(event) === false) { // prevent dupes
      listeners[data.fromModule].push(event);
    }
  });
  messageEvent.on(data.fromModule, ipcEmit, { // listen for our moduleIdent
    socket: socket
  });
  messageEvent.emit("_messageRouter", data); // pass the sub through to the router
});


// wrapper for ipc.server.emit in case we want to do anything here in the future
// also allows us to remove listeners from messageToModule
function ipcEmit(data) {
  //logger.debug(`ipcEmit:\n${JSON.stringify(data, null, 2)}`);
  ipc.server.emit(this.socket, data.toModule, data);
}

// if a module wants to stop listening to some events
// ex a irc connector closes a connection to a channel or server
ipc.server.on("_unsubscribe", function(data) {
  logger.debug(`unsubscribe received from [${data.fromModule}]:\n${JSON.stringify(data, null, 2)}`);
  data.type = "_unsubscribe";
  data.events.forEach(function(event) {
    messageEvent.removeListener(event, ipcEmit);
    messageEvent.emit("_messageRouter", data);
    logger.debug(`Removed listener for event: [${event}]`);
  });
});


// these events will be used to do administrative tasks...
// like loading/unloading modules, connecting to new servers, etc
ipc.server.on("LOADMODULE", function(data) {
  loadModule(data.module).then(function(result) {
    if (result === true) {
      // reply back to that channel saying it loaded
      logger.info(`Loaded module [${data.module}]`);
      messageEvent.emit(`${data.platform}%${data.server}%${data.channel}`, {
        platform: data.platform,
        server: data.server,
        channel: data.channel,
        fromModule: moduleIdent,
        toModule: data.fromModule,
        message: `Module [${data.module}] loaded. pid: [${children[data.module].pid}]`,
        timestamp: Date.now(),
        event: `${data.platform}%${data.server}%${data.channel}`
      });
    } else {
      logger.error(`Function loadModule returned an unknown error when loading [${data.module}]`);
      messageEvent.emit(`${data.platform}%${data.server}%${data.channel}`, {
        platform: data.platform,
        server: data.server,
        channel: data.channel,
        fromModule: moduleIdent,
        toModule: data.fromModule,
        message: `Module [${data.module}] load failed]: ${result}`,
        timestamp: Date.now(),
        event: `${data.platform}%${data.server}%${data.channel}`
      });
    }
  }).catch(function(error) {
    logger.error(error.message);
    messageEvent.emit(`${data.platform}%${data.server}%${data.channel}`, {
      platform: data.platform,
      server: data.server,
      channel: data.channel,
      fromModule: moduleIdent,
      toModule: data.fromModule,
      message: error.message,
      timestamp: Date.now(),
      event: `${data.platform}%${data.server}%${data.channel}`
    });
  });
});


ipc.server.on("UNLOADMODULE", function(data) {
  unloadModule(data.module).then(function(result) {
    if (result === true) {
      // reply back to that channel saying it unloaded
      logger.info(`Unloaded module [${data.module}]`);
      messageEvent.emit(`${data.platform}%${data.server}%${data.channel}`, {
        platform: data.platform,
        server: data.server,
        channel: data.channel,
        fromModule: moduleIdent,
        toModule: data.fromModule,
        message: `Module [${data.module}] unloaded.`,
        timestamp: Date.now(),
        event: `${data.platform}%${data.server}%${data.channel}`
      });
    } else {
      logger.error(`Function unloadModule returned an unknown error when loading [${data.module}]`);
      messageEvent.emit(`${data.platform}%${data.server}%${data.channel}`, {
        platform: data.platform,
        server: data.server,
        channel: data.channel,
        fromModule: moduleIdent,
        toModule: data.fromModule,
        message: `Function unloadModule returned an unknown error when loading [${data.module}]`,
        timestamp: Date.now(),
        event: `${data.platform}%${data.server}%${data.channel}`
      });
    }
  }).catch(function(error) {
    logger.error(error.message);
    messageEvent.emit(`${data.platform}%${data.server}%${data.channel}`, {
      platform: data.platform,
      server: data.server,
      channel: data.channel,
      fromModule: moduleIdent,
      toModule: data.fromModule,
      message: error.message,
      timestamp: Date.now(),
      event: `${data.platform}%${data.server}%${data.channel}`
    });
  });
});


ipc.server.on("RELOADMODULE", function(data) {
  reloadModule(data.module).then(function(result) {
    if (result === true) {
      // reply back to that channel saying it loaded
      logger.info(`Reloaded module [${data.module}]`);
      messageEvent.emit(`${data.platform}%${data.server}%${data.channel}`, {
        platform: data.platform,
        server: data.server,
        channel: data.channel,
        fromModule: moduleIdent,
        toModule: data.fromModule,
        message: `Module [${data.module}] reloaded. pid: [${children[data.module].pid}]`,
        timestamp: Date.now(),
        event: `${data.platform}%${data.server}%${data.channel}`
      });
    } else {
      logger.error(`Function reloadModule returned an unknown error when reloading [${data.module}]`);
      messageEvent.emit(`${data.platform}%${data.server}%${data.channel}`, {
        platform: data.platform,
        server: data.server,
        channel: data.channel,
        fromModule: moduleIdent,
        toModule: data.fromModule,
        message: `Function unloadModule returned an unknown error when reloading [${data.module}]`,
        timestamp: Date.now(),
        event: `${data.platform}%${data.server}%${data.channel}`
      });
    }
  }).catch(function(error) {
    logger.error(error.message);
    messageEvent.emit(`${data.platform}%${data.server}%${data.channel}`, {
      platform: data.platform,
      server: data.server,
      channel: data.channel,
      fromModule: moduleIdent,
      toModule: data.fromModule,
      message: error.message,
      timestamp: Date.now(),
      event: `${data.platform}%${data.server}%${data.channel}`
    });
  });
});


// give it a module name, and this loads it
// ie. loadModule("echo");
// returns a promise
// resolves true if module loaded sucessfully
// rejects with a Error object if module load failed at some point
function loadModule(moduleIdent) {
  return new Promise(function(resolve, reject) {
    // if the requested module is already loaded
    if (children[moduleIdent]) {
      reject(new Error(`Module [${moduleIdent}] is already loaded. pid: ${children[moduleIdent].pid}`));
    } else {
      logger.info(`Loading module [${moduleIdent}]`);
      const childPath = `${process.cwd()}/modules/${moduleIdent}.js`
      // check and make sure we can read the target file
      fs.access(childPath, fs.constants.R_OK, function(error) {
        if (error) {
          reject(new Error(`Module [${moduleIdent}] could not be read: ${error}`));
        } else {
          // fork off the child module
          children[moduleIdent] = fork(childPath, [], ["pipe", "pipe", "pipe", "ipc"]);
          // if the fork fails for some reason
          children[moduleIdent].on("error", function(err) {
            reject(new Error(`Module [${moduleIdent}] failed to fork: ${err}`));
          });

          // when the child is ready to rock it sends us this
          children[moduleIdent].on("message", function(data) {
            if (data.type === "status") {
              if (data.status === "connected") {
                logger.info(`Module [${moduleIdent}] loaded. pid: [${children[moduleIdent].pid}]`);
                loadedModules.push(moduleIdent);
                resolve(true);
              }
              // or if the module tells us that something went wrong
            } else if (data.status === "failed") {
              reject(new Error(`Module [${moduleIdent}] failed to initalize`));
            }
          });
          // monitor for child process dying
          children[moduleIdent].on("exit", function(code, signal) {
            if (signal) {
              logger.warn(`Module [${moduleIdent}] exited with code [${code}] on signal [${signal}]`);
            } else {
              logger.warn(`Module [${moduleIdent}] exited with code [${code}]`);
            }
          });
        }
      });
    }
  });
}


// unloads a module
// functionally identitical to loadMOdule
function unloadModule(moduleIdent) {
  return new Promise(function(resolve, reject) {
    if (children[moduleIdent]) {
      logger.info(`Unloading module [${moduleIdent}]`);
      logger.debug(`Events: ${listeners[moduleIdent]}`)
      listeners[moduleIdent].forEach(function(event) {
        messageEvent.removeListener(event, ipcEmit);
      });
      children[moduleIdent].kill("SIGTERM");
      children[moduleIdent].on("exit", function() {
        delete children[moduleIdent];
        delete listeners[moduleIdent];
        resolve(true);
      });
    } else {
      reject(new Error(`Module [${moduleIdent}] is not loaded.`));
    }
  });
}


// reloads a module
function reloadModule(moduleIdent) {
  return new Promise(function(resolve, reject) {
    logger.info(`Reloading module [${moduleIdent}]`);
    unloadModule(moduleIdent).then(function(result) {
      if (result === true) {
        loadModule(moduleIdent).then(function(result) {
          if (result === true) {
            logger.debug(`Module [${moduleIdent}] loaded. pid: [${children[moduleIdent].pid}]`);
            resolve(true)
          } else {
            reject(new Error(`Function loadModule returned an unknown error when loading [${moduleIdent}]`));
          }
        }).catch(logger.error); // error in loadModule
      } else {
        reject(new Error(`Error unloading module [${moduleIdent}]: ${result}`));
      }
    }).catch(logger.error); // error in unloadModule
  })
}


// gotta catch "em all
logger.silly("Go! Totodile! I choose you!");

// handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(JSON.stringify(err, null, 2))
  throw new Error(err);
});

// TODO if a child dies, purge them && restart up to 3x

// TODO implement a way to tell a child to reload config without restarting the whole module

// TODO implement core config reloading

// TODO implement config saving

// // for testing: unload echo after 6 seconds
// setTimeout(function() {
//   unloadModule("echo");
// }, 6000);
//
// // for testing: load echo after 10 seconds
// setTimeout(function() {
//   loadModule("echo");
// }, 10000);
//
// // for testing: reload echo after 10 seconds
// setTimeout(function() {
//   reloadModule("invalid");
// }, 18000);
