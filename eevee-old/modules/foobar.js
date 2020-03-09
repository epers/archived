'use strict';
// foo bar baz

const moduleIdent = 'foobar';

const config = require(`${process.cwd()}/lib/config.js`).config(moduleIdent);
const log = require(`${process.cwd()}/lib/log.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
const ipc = require(`${process.cwd()}/lib/ipc.js`).ipc(moduleIdent, log);
const registerCommands = require(`${process.cwd()}/lib/common.js`).registerCommands(moduleIdent, ipc);

ipc.on('message', foo);

const subscriptions = ['foo'];
const adminCommands = [];
registerCommands(subscriptions, adminCommands);

function foo(data) {
  const message = JSON.parse(data.message.toString());
  ipc.send(JSON.stringify({
    'type': 'outgoingMessage',
    'version': 1, // message format version
    'origModule': moduleIdent, // the module that first sent this message
    'fromModule': moduleIdent,
    'toModule': message.origModule, // who to send the message to
    'server': message.server, // [some.fqdn]
    'to': message.channel, // [#channel,@person]
    'text': 'this is a test of the irc emergency alert system. please remain calm and stay in your homes.',
    'messageType': message.messageType, // [chanmsg,privmsg,notice,raw]
  }), message.origModule);
  return 0;
}
