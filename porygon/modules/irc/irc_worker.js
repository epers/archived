const IRCLIB = require('irc-framework');
//const config = require(process.cwd() + "/etc/modules/core/irc.js");

var argv = require('minimist')(process.argv.slice(2));

var client = new IRCLIB.Client();

var client_config = {
    server: argv.s,
    port: argv.p,
    nick: argv.n,
    channels: argv.c,
    ssl: argv.t
}

client_config.channels = client_config.channels.split(',');
client_config.ssl = (client_config.ssl.trim() == 'true');
client_config.server = client_config.server.trim();
client_config.nick = client_config.nick.trim();

client.connect({
    host: client_config.server,
    port: client_config.port,
    nick: client_config.nick,
    ssl: client_config.ssl
});
var buffers = [];

client.on('registered', function () {

    process.send({
        type: 'log',
        module: `irc%${client_config.server}`,
        content: `connected to ${client_config.server}`
    });

    client_config.channels.forEach(function (entry) {
        entry = entry.trim();
        buffers.push(entry);
        var channel = client.channel(entry);
        channel.join();
        process.send({
            type: 'log',
            module: `irc%${client_config.server}`,
            content: `joined ${entry}`
        });
    });
});

client.on('message', function (message) {
    process.send({
        type: 'message',
        server: client_config.server,
        raw: message
    });
});

process.on('message', (message) => {
    if (message.command == 'quit') {
        console.log("leaving")
        console.log(message.text)
        client.quit(message.text.slice(1).join(' '));
    } else if (message.command == 'part') {
        var channel = message.text[0];
        var partmsg = message.text.slice(1).join(' ');
        client.part(channel, partmsg);
    } else if (message.command == 'join') {
        var channel = message.text[0]
        var key = message.text.slice(message.text).slice(1).join(' ');
        client.join(channel, key);
        buffers.push(channel);
    } else if (message.command == 'say') {
        client.say(message.target, message.text.join(' '));
    }
});