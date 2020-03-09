'use strict';
// echo echo echo echo

const moduleIdent = 'echo';

const npid = require('npid');
const pid = new npid.create(`${process.cwd()}/pid/${moduleIdent}`);
pid.removeOnExit();

const config = require(`${process.cwd()}/lib/config.js`).config(moduleIdent);
const log = require(`${process.cwd()}/lib/log.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
const ipc = require(`${process.cwd()}/lib/ipc.js`).ipc(moduleIdent, log);
const registerCommands = require(`${process.cwd()}/lib/common.js`).registerCommands(moduleIdent, ipc);

ipc.on('message', handleIpcMessage);

const subscriptions = ['echo'];
const adminCommands = ['say'];
registerCommands(subscriptions, adminCommands);

process.on('SIGTERM', () => {
  process.exitCode = 0;
  ipc.removeAllListeners();
  ipc.stopListening();
  pid.remove(`${process.cwd()}/pid/${moduleIdent}`);
});

function handleIpcMessage(data) {
  const message = JSON.parse(data.message.toString());
  switch (message.type) {
    case 'incomingMessage': {
      if (message.command === 'echo') {
        echo(message);
      }
      return 0;
    }
    case 'controlMessage': {
      if (message.command === 'say') {
        say(message);
      }
      return 0;
    }
    default: {
      return 0;
    }
  }
}

function echo(message) {
  const output = [{ 'text': message.args }];
  // does config say to strip colors/styles?
  if (config.stripColors) {
    output[0].color = 'stripColors';
  }
  if (config.stripStyle) {
    output[0].format = 'stripStyle';
  }
  // parrot it back to where we heard it
  ipc.send(JSON.stringify({
    'type': 'outgoingMessage',
    'version': 1, // message format version
    'origModule': moduleIdent, // the module that first sent this message
    'fromModule': moduleIdent,
    'toModule': message.origModule, // who to send the message to
    'server': message.server, // [some.fqdn]
    'to': message.channel, // [#channel,@person]
    'text': output, // {}
    'messageType': message.messageType, // [chanmsg,privmsg,notice,raw]
  }), message.origModule);
  return 0;
}

function say(message) {
  log.debug(JSON.stringify(message, null, '  '));
  ipc.send(JSON.stringify({
    'type': 'outgoingMessage',
    'version': 1, // message format version
    'origModule': moduleIdent, // the module that first sent this message
    'fromModule': moduleIdent,
    'toModule': message.origMessage.origModule, // who to send the message to
    'server': message.origMessage.server, // [some.fqdn]
    'to': message.origMessage.channel, // [#channel,@person]
    'text': message.args, // {}
    'messageType': message.origMessage.messageType,
  }), message.origMessage.origModule);
}
