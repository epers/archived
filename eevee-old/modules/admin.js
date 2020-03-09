'use strict';
// admin recieves administrative commands and acts on them

const moduleIdent = 'admin';

const config = require(`${process.cwd()}/lib/config.js`).config(moduleIdent);
const log = require(`${process.cwd()}/lib/log.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
const ipc = require(`${process.cwd()}/lib/ipc.js`).ipc(moduleIdent, log);
const registerCommands = require(`${process.cwd()}/lib/common.js`).registerCommands(moduleIdent, ipc);

ipc.on('message', handleIpcMessage);

const subscriptions = [ 'admin' ];
const adminCommands = [];
registerCommands(subscriptions, adminCommands);

// keep track of listeners in here
const listeners = {};

function handleIpcMessage(data) {
  const message = JSON.parse(data.message.toString());
  switch (message.type) {
    case 'subscribe': {
      registerCommand(message);
      return 0;
    }
    case 'incomingMessage': {
      parseCommand(message);
      return 0;
    }
    case 'controlMessage': {
      handleControlMessage(message);
      return 0;
    }
    case 'notification': {
      return 0;
    }
    case 'adminQuery': {
      // TODO: this
      return 0;
    }
    default: {
      return 0;
    }
  }
}

function parseCommand(message) {
  const command = message.args.split(' ')[0];
  const args = message.args.split(' ').slice(1).join(' ');
  const query = {
    'platform': message.platform,
    'server': message.server,
    'channel': message.channel,
    'user': message.from,
    'ident': message.ident,
    'command': command,
    'args': args
  };
  log.debug(`Admin command received: ${JSON.stringify(message, null, '  ')}`);
  log.debug(`Listeners: ${JSON.stringify(listeners, null, '  ')}`);
  if (isAllowed(query)) {
    Object.keys(listeners).forEach((key) => {
      listeners[key].forEach((entry) => {
        if (entry === command) {
          // send it off to the module who registered that command
          log.debug(`Sending command to module ${key}`);
          ipc.send(JSON.stringify({
            'type': 'controlMessage',
            'version': 1,
            'origModule': moduleIdent,
            'fromModule': moduleIdent,
            'toModule': key,
            'command': command,
            'args': args,
            'notify': message.origModule,
            'origMessage': message
          }), key);
        }
        return 0;
      });
      return 0;
    });
  }
  return 0;
}

function registerCommand(message) {
  // modules register administrative commands like us (just like how modules register normal commands with router)
  log.debug(`Subscribe request received from [${message.origModule}]: ${message.adminCommands.toString().replace(/,/g, ', ')}`);
  listeners[message.origModule] = message.adminCommands;
  return 0;
}

function isAllowed(query) {
  if (query.user === config.admins[0]) {
    return true;
  } else {
    return false;
  }
}

function handleControlMessage(message) {
  // nothing for now
  return 0;
}
