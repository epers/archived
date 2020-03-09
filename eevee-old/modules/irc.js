'use strict';
// irc-supervisor controls and interacts with irc worker processes

const fork = require('child_process').fork;
const fs = require('fs');

const moduleIdent = 'irc';

const config = require(`${process.cwd()}/lib/config.js`).config(moduleIdent);
const log = require(`${process.cwd()}/lib/log.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
const ipc = require(`${process.cwd()}/lib/ipc.js`).ipc(moduleIdent, log);
const registerCommands = require(`${process.cwd()}/lib/common.js`).registerCommands(moduleIdent, ipc);
const initConnections = fs.readdirSync(`${process.cwd()}/etc/irc/`);

ipc.on('message', handleIpcMessage);

const subscriptions = [];
const adminCommands = ['irc'];
registerCommands(subscriptions, adminCommands);

const ircWorkers = {};

log.info(`Init IRC Connections: [${initConnections}]`);
initConnections.forEach(spawnWorkerFile);

// spawn a worker from a config file
function spawnWorkerFile(configFile) {
  const name = require(`${process.cwd()}/etc/irc/${configFile}`).name;
  ircWorkers[name] = fork(`${process.cwd()}/modules/irc-worker.js`, [name]);
  log.debug(`New irc worker started [${name}] ${ircWorkers[name].pid}`);
}

// deal with incoming ipc messages
function handleIpcMessage(data) {
  const message = JSON.parse(data.message.toString());
  log.debug(JSON.stringify(message, null, '  '));
  switch (message.type) {
    // join/part/quit/connect/disconnect/reconnect/etc
    case 'controlMessage': {
      handleControlMessage(message);
      return 0;
    }
    case 'incomingMessage': {
      return 0;
    }
    case 'notification': {
      handleNotification(message);
      return 0;
    }
    default: {
      return 0;
    }
  }
}

// deal with incoming control messages
function handleControlMessage(message) {
  const command = message.args.split(' ')[0];
  const args = message.args.split(' ').slice(1).join(' ');
  if (command === 'supervisor') {
    // do stuff
  } else {
    const worker = message.origMessage.origModule; // TODO - later on let us specify a server by parsing args
    const validCommands = ['join', 'part', 'quit', 'nick', 'reconnect', 'whois'];
    if (validCommands.includes(command)) {
      sendChildMessage(worker, message, command, args);
    }
  }
  return 0;
}

// send a message to a child
function sendChildMessage(worker, message, command, args) {
  ipc.send(JSON.stringify({
    'type': 'controlMessage',
    'version': 1,
    'command': command,
    'args': args,
    'fromModule': moduleIdent,
    'toModule': worker,
    'notify': 'irc',
    'origMessage': message
  }), worker);
}

// do something with notifications
function handleNotification(message) {
  log.debug(`Notification received from ${message.from}: ${JSON.stringify(message, null, '  ')}`);
  if (message.result === 'socket close') { // if a child tells us that it disconnected from the server
    log.info(`Child ${message.from} has disconnected from the server. Killing the child process.`);
    // kill the child
    ircWorkers[message.args].kill('SIGTERM');
    // remove from collection
    delete ircWorkers[message.args];
  }
}
