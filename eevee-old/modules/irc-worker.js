'use strict';

const IRCLIB = require('irc-framework');
const color = require('irc-colors');

const name = require(`${process.cwd()}/etc/irc/${process.argv.slice(2)}.js`).name;
const moduleIdent = `irc-${name}`;

const config = require(`${process.cwd()}/lib/config.js`).config(moduleIdent, `irc/${name}`);
const log = require(`${process.cwd()}/lib/log.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
const ipc = require(`${process.cwd()}/lib/ipc.js`).ipc(moduleIdent, log);
const registerCommands = require(`${process.cwd()}/lib/common.js`).registerCommands(moduleIdent, ipc);

ipc.on('message', handleIpcMessage);

const subscriptions = [];
const adminCommands = [];
registerCommands(subscriptions, adminCommands);

log.debug(JSON.stringify(process.argv, null, '  '));

const client = new IRCLIB.Client();
const channels = [];
let isReconnecting = false;

client.on('message', handleIrcMessage);
client.on('registered', clientRegistered);
client.on('socket close', socketClosed);

log.debug(JSON.stringify(config, null, '  '));

// connect to the server
client.connect(config);

/*  example incoming irc message:
    28:05  [4607] [debug]   [irc-worker-wetfish] Message received: {
      "type": "privmsg",
      "nick": "Weazzy",
      "ident": "Weazzy",
      "hostname": "Fish-ap3265.dicro.us",
      "target": "#eevee",
      "message": "dddddddddddd",
      "tags": {}
}
*/
// handle incoming ipc messages
function handleIpcMessage(data) {
  const message = JSON.parse(data.message.toString());
  switch (message.type) {
    case 'outgoingMessage': {
      handleOutgoingMessage(message);
      return 0;
    }
    case 'controlMessage': {
      handleControlMessage(message);
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

// handle incoming control messages
function handleControlMessage(message) {
  log.debug(JSON.stringify(message, null, '  '));
  switch (message.command) {
    // quit/disconnect from the server
    case 'quit': {
      shutdownClient(0, message.args);
      return 0;
    }
    // leave a channel
    case 'part': {
      part(message.args);
      return 0;
    }
    case 'join': {
      join(message.args.split(' ')[0], message.args.slice(message.args).split(' ').slice(1)); // channel, key
      return 0;
    }
    case 'reconnect': {
      reconnect();
      return 0;
    }
    case 'whois': {
      whois(message.args.split(' ')[0]);
      return 0;
    }
    case 'nick': {
      changeNick(message.args.split(' ')[0]);
      return 0;
    }
    default: {
      return 0;
    }
  }
}

// handle outgoing notifications (like from the init module)
function handleNotification(message) {
  log.debug(`Notification received from ${message.fromModule}: ${JSON.stringify(message, null, '  ')}`);
  message.to = message.channel;
  handleOutgoingMessage(message);
}

// handle incoming messages from the irc server
function handleIrcMessage(data) {
  log.debug(`Message received: ${JSON.stringify(data, null, '  ')}`);
  let _messageType = null;
  if (data.target.split('')[0] === '#') {
    _messageType = 'chanmsg';
  } else {
    _messageType = 'privmsg';
    data.target = data.nick;
  }
  if (data.type === 'notice') {
    if (data.from_server === true) {
      _messageType = 'srvmsg';
    } else {
      _messageType = 'notice';
    }
  }
  const ipcOutput = {
    'type': 'incomingMessage',
    'version': 1, // message format version
    'origModule': moduleIdent, // the module that /first/ sent this message
    'fromModule': moduleIdent, // the module sending /this/ message
    'toModule': 'router', // who to send the message to
    'platform': 'irc', // [irc,matrix,etc]
    'server': config.server, // [some.fqdn]
    'channel': data.target, // [#channel,@person]
    'from': data.nick, // [string]
    'ident': data.hostname, // [string]
    'text': data.message, // [string]
    'messageType': _messageType, // [chanmsg,privmsg,notice,srvmsg]
    'ext': { // optional extended capabilities
      'raw': data
    }
  };
  ipc.send(JSON.stringify(ipcOutput), 'router');
  return 0;
}

// handle sending normal chan/privmsgs to the server
function handleOutgoingMessage(message) {
  let finalString = '';
  switch (typeof message.text) {
    case 'string': {
      finalString = message.text;
      client.say(message.to, finalString);
      return 0;
    }
    case 'object': {
      Object.keys(message.text).forEach((block) => {
        const entry = message.text[block];
        if (typeof entry.color !== 'undefined') {
          if (typeof entry.format !== 'undefined') {
            entry.text = color[entry.format](entry.text);
            finalString += color[entry.color](entry.text);
          } else {
            finalString += color[entry.color](entry.text);
          }
        } else if (typeof entry.format !== 'undefined') {
          if (typeof entry.color !== 'undefined') {
            entry.text = color[entry.color](entry.text);
            finalString += color[entry.format](entry.text);
          } else {
            finalString += color[entry.format](entry.text);
          }
        } else {
          finalString += entry.text;
        }
      });
      client.say(message.to, finalString);
      return 0;
    }
    default: {
      return 0;
    }
  }
}

// stuff to do when we're connected to the server
function clientRegistered() {
  log.debug(`Connected to ${config.host}:${config.port}`);
  // join our initial channels
  config.channels.forEach((entry) => {
    channels.push(entry);
    const channel = client.channel(entry);
    channel.join();
    log.debug(`Joined channel ${entry}`);
  });
  return 0;
}

// what to do when the server connection is closed
function socketClosed() {
  if (!isReconnecting) {
    /*  ipc.send(JSON.stringify({
      'type': 'notification',
      'version': 1,
      'fromModule': moduleIdent,
      'toModule': 'irc',
      'args': name,
      'result': 'socket close',
      'err': new Error(`Disconnected from server ${config.host}`),
    }), 'irc'); */
  }
}

// call this to commit harakiri
function shutdownClient(exitCode, quitMsg) {
  if (quitMsg === undefined) {
    quitMsg = 'EEVEE v0.0.420';
  }
  client.quit(quitMsg);
  log.info('IRC worker process shutting down');
  client.removeAllListeners();
  ipc.removeAllListeners();
  ipc.stopListening();
  if (exitCode === undefined) {
    exitCode = 0;
  }
  process.exitCode = exitCode;
}

// call this to join a channel
function join(channel, key) {
  client.join(channel, key);
  channels.push(channel);
}

// call this to leave a channel
function part(args) {
  log.debug(`Part request: ${args}`);
  let partChannel = null;
  let partmsg = null;
  // is the first character of args a # (ex ~admin irc part #foo)
  if (args.split(' ')[0].split('')[0] === '#') {
    partChannel = args.split(' ')[0];
    partmsg = args.split(' ').slice(2).join(' '); // TODO - check this
  } else { // if not, we'll leave the channel that the command was given in
    partChannel = args.origMessage.origMessage.channel;
    partmsg = args.split(' ').slice(1).join(' ');
  }
  client.part(partChannel, partmsg);
  for (let i = 0; i < channels.length; i++) {
    if (channels[i] === partChannel) {
      channels.splice(i, 1);
    }
  }
  return 0;
}

// call this to reconnect to a server
function reconnect(retries, timeout) { // TODO: implement these two options
  isReconnecting = true;
  client.quit();
  setTimeout(() => {
    client.connect(config);
    isReconnecting = false;
    return 0;
  }, 500);
  return 0;
}

// send a whois request to the server
function whois(target) {
  client.whois(target, (result) => {
    log.info(`Whois results: ${JSON.stringify(result, null, '  ')}`);
  });
}

// change our nick
function changeNick(newNick) {
  client.changeNick(newNick);
}
