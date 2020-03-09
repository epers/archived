'use strict';

/*
new Irc.Client({
    nick: 'ircbot',
    username: 'ircbot',
    gecos: 'ircbot',
    encoding: 'utf8',
    version: 'node.js irc-framework',
    enable_chghost: false,
    enable_echomessage: false,
    auto_reconnect: true,
    auto_reconnect_wait: 4000,
    auto_reconnect_max_retries: 3,
    ping_interval: 30,
    ping_timeout: 120,
    webirc: {
        password: '',
        username: '*',
        hostname: 'users.host.isp.net',
        ip: '1.1.1.1',
    }
});
*/

module.exports = {
  'consoleLogLevel': 'debug',
  'fileLogLevel': 'error',
  'name': 'wetfish',
  'channels': ['#botspam', '#eevee'],
  'gecos': 'eevee version 0.6',
  'host': 'cannonfodder.wetfish.net',
  'port': 6697,
  'ssl': true,
  'auto_reconnect': true,
  'nick': 'eevee',
  'username': 'eevee',
};
