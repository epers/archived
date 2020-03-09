'use strict';

// logs into wetfish services

const moduleIdent = 'wetfishservices';

const config = require(`${process.cwd()}/lib/config.js`).config(moduleIdent);
const log = require(`${process.cwd()}/lib/log.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
const ipc = require(`${process.cwd()}/lib/ipc.js`).ipc(moduleIdent, log);
const registerCommands = require(`${process.cwd()}/lib/common.js`).registerCommands(moduleIdent, ipc);
/* db/wetfishservices.js:
'use strict';
module.exports = {
  'nickservToken': 'YOUR_TOKEN_HERE'
}; */
const nickservToken = require(`${process.cwd()}/db/wetfishservices.js`).nickservToken;

ipc.on('message', handleIpcMessage);

const subscriptions = [ '_broadcast' ];
const adminCommands = [ 'wetfishservices' ];
registerCommands(subscriptions, adminCommands);

const nickserv = 'NickServ';
const chanserv = 'ChanServ';

function handleIpcMessage(data) {
  const message = JSON.parse(data.message.toString());
  switch (message.type) {
    case 'controlMessage': {
      handleControlMessage(message);
      break;
    }
    case 'incomingMessage': {
      handleIncomingMessage(message);
      break;
    }
    default: {
      break;
    }
  }
}

function handleControlMessage(message) {
  const command = message.args.split(' ')[1];
  const args = message.args.split(' ').slice(2).join(' ');
  const target = message.args.split(' ')[0];
  log.debug(command);
  log.debug(args);
  const outputs = {
    'identify': [{ 'text': `identify ${nickservToken}` }],
    'login': [{ 'text': 'login' }],
    'host': [{ 'text': `host ${args[0]}` }],
    'ghost': [{ 'text': `ghost ${args[0]}` }],
    'register': [{ 'text': 'register' }],
    'help': [{ 'text': 'help' }]
  };
  if (command in outputs) {
    const ipcOutput = {
      'type': 'outgoingMessage',
      'version': 1,
      'origModule': moduleIdent,
      'fromModule': moduleIdent,
      'toModule': message.origMessage.origModule,
      'server': message.origMessage.server,
      'to': target,
      'text': outputs[command],
      'messageType': 'privmsg',
    };
    log.debug(`ipcOutput: ${JSON.stringify(ipcOutput, null, '  ')}`);
    log.debug(`Target module: ${message.origMessage.origModule}`);
    ipc.send(JSON.stringify(ipcOutput), message.origMessage.origModule);
  }
}


function handleIncomingMessage(message) {
  switch (message.from) {
    default: {
      return 0;
    }
    case nickserv: {
      log.info(`Message from nickserv: ${message.text}`);
      return 0;
    }
    case chanserv: {
      log.info(`Message from chanserv: ${message.text}`);
      return 0;
    }
  }

}
