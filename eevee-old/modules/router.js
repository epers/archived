'use strict';
// router maintains a command registry, and routes message to the right modules

const moduleIdent = 'router';

const config = require(`${process.cwd()}/lib/config.js`).config(moduleIdent);
const log = require(`${process.cwd()}/lib/log.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
const ipc = require(`${process.cwd()}/lib/ipc.js`).ipc(moduleIdent, log);
const registerCommands = require(`${process.cwd()}/lib/common.js`).registerCommands(moduleIdent, ipc);

ipc.on('message', handleIpcMessage);

const subscriptions = [];
const adminCommands = [];
registerCommands(subscriptions, adminCommands);

const listeners = {};

// do stuff with incoming ipc messages
function handleIpcMessage(data) {
  const message = JSON.parse(data.message.toString());
  if (message.type === 'subscribe') {
    registerListener(message.subscriptions, message.origModule);
  }

  if (message.type === 'incomingMessage') {
    log.debug(`New incomingMessage received from [${message.origModule}]: ${JSON.stringify(message, null, '  ')}`);
    // send to all modules who have registered _broadcast as a subscription
    Object.keys(listeners).forEach((key) => {
      listeners[key].forEach((entry) => {
        if (entry === '_broadcast') {
          message.command = '_broadcast';
          ipc.send(JSON.stringify(message), key);
        }
      });
    });

    // sed out the first word, that's our prefix + command
    // TODO come back to this and allow for multi-character prefixes... somehow
    const prefix = message.text.slice(0, 1);
    const command = message.text.slice(1).split(' ')[0];
    const args = message.text.slice(1).split(' ').slice(1).join(' ');

    // then we need to check it against our list of allowed prefix/server/channel/user combos
    const query = {
      'prefix': prefix,
      'platform': message.platform,
      'server': message.server,
      'channel': message.channel,
      'user': message.from,
      'ident': message.ident,
      'command': command,
      'args': args
    };

    log.debug(`isAllowed Query: ${JSON.stringify(query, null, '  ')}`);

    if (isAllowed(query)) {
      // first let's add some entries to our message object
      message.command = command;
      message.args = args;
      message.prefix = prefix;

      // then we need to find out what module(s) our command goes to
      // there's probably a more elegant way of doing this - if you know of one, pls let me know!
      Object.keys(listeners).forEach((key) => {
        listeners[key].forEach((entry) => {
          if (entry === command) {
            // send it off to the module who registered that command
            ipc.send(JSON.stringify(message), key);
          }
        });
      });
    }
  }
}

// register module subscriptions
function registerListener(subscriptions, origModule) {
  log.debug(`Subscribe request received from [${origModule}]: ${subscriptions.toString().replace(/,/g, ', ')}`);
  listeners[origModule] = subscriptions;
}

// filter function
function isAllowed(query) {
  // for now we'll just allow everything that matches a prefix of ~  ...
  // TODO actually do this. We want all sorts of filtering and matching and crazy shit up in here
  /*
    const query = {
      'prefix': prefix,
      'platform': message.platform,
      'server': message.server,
      'channel': message.channel,
      'user': message.from,
      'ident': message.ident,
      'command': command,
      'args': args
    };
  */
  if (query.prefix === '~') {
    return true;
  } else {
    return false;
  }
}
