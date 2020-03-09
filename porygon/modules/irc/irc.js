const fork = require('child_process').fork;

if (require.main === module) {
    var irc = {
        config: {
            connections: [
                wetfish = {
                    server: 'irc.wetfish.net',
                    port: 6697,
                    nick: 'Porygon-dev',
                    channels: ['#porygon'],
                    ssl: true
                },
                /* soupwhale = {
                    server: "irc.soupwhale.com",
                    nick: "Porygon-dev",
                    channels: ["#porygon"],
                    ssl: false,
                    port: 6667
                },

                 wetfish = {
                    name: 'wetfish',
                    server: 'irc.wetfish.net',
                    port: 6697,
                    nick: 'Porygon',
                    channels: ['#wetfish', '#carfish', "botspam"],
                    ssl: true
                },
                soupwhale = {
                    server: "irc.soupwhale.com",
                    nick: "Porygon",
                    channels: ["#porygon"],
                    ssl: false,
                    port: 6667
                } */
            ],
            debug: false
        },

        irc_workers: [],

        core_message: function (message) {
            // handle the incoming message from core
            /* message = {
                direction: "out",
                server: "irc.wetfish.net",
                type: "chanmsg",
                target: "#porygon",
                text: "foo bar baz",
            } */
            if (message.type == 'chanmsg' || message.type == 'privmsg') {
                irc.irc_workers[message.server].send({
                    /* message = {
                        command: "say", // if chanmsg or privmsg
                        target: message.target,
                        text: message.text
                    } */
                    command: "say",
                    target: message.target,
                    text: message.text
                })
            } else if (message.type == 'command') {
                if (message.command == 'disconnect') {
                    irc.disconnect(message.server, message.text)
                } else if (message.command == 'join') {
                    irc.join(message.server, message.text)
                } else if (message.command == 'part') {
                    irc.part(message.server, message.text)
                } else if (message.command == 'shutdown') {
                    irc.shutdown()
                }
            }
        },

        init: function () {
            // for each irc connection, connect
            Object.keys(irc.config.connections).forEach(function (connection) {
                irc.connect(connection)
            })
        },

        shutdown: function () {
            // close all client connections
            console.log("shutdown function")
            /* irc.irc_workers.forEach(function (worker) {
                console.log("worker")
                console.log(worker)
                worker.send({
                    command: "quit",
                    text: ["Porygon IRCLink v2.0"]
                })
            }) */
            Object.keys(irc.config.connections).forEach(function (connection) {
                console.log(irc.config.connections[connection].server)
                irc.disconnect(irc.config.connections[connection].server, ["", "Porygon IRCLink v2.0"])
            })
        },

        connect: function (connection) {
            irc.irc_workers[irc.config.connections[connection].server] = fork(process.cwd() + '/modules/irc/irc_worker.js', [
                `-s ${irc.config.connections[connection].server}`,
                `-p ${irc.config.connections[connection].port}`,
                `-n ${irc.config.connections[connection].nick}`,
                `-c ${irc.config.connections[connection].channels}`,
                `-t ${irc.config.connections[connection].ssl}`
            ], {
                stdio: ['inherit', 'inherit', 'inherit', 'ipc']
            });

            irc.irc_workers[irc.config.connections[connection].server].on('message', function (message) {
                if (message.type == 'message') {

                    var type
                    var reply_to
                    if (message.raw.type == 'notice') {
                        type = 'notice'
                        reply_to = message.raw.target
                    } else if (message.raw.target.slice(0, 1) == '#') {
                        type = 'chanmsg'
                        reply_to = message.raw.target
                    } else {
                        type = 'privmsg'
                        reply_to = message.raw.nick
                    }

                    // preparse the message into the expected format
                    var to_send = {
                        direction: "in",
                        platform: "irc",
                        server: message.server,
                        reply_to: reply_to,
                        from: message.raw.nick,
                        text: message.raw.message,
                        type: type,
                        raw: message.raw
                    }
                    process.send(to_send)
                }
            })
        },

        disconnect: function (server, quitmsg) {
            irc.irc_workers[server].send({
                command: "quit",
                text: quitmsg
            })
            irc.irc_workers[server].kill
            delete irc.irc_workers[server]
        },

        join: function (server, channel) {
            irc.irc_workers[server].send({
                command: "join",
                text: channel
            })
        },

        part: function (server, text) {
            irc.irc_workers[server].send({
                command: "part",
                text: text
            })
        }
    }

    // parse incoming messages from parent
    process.on("message", function (message) {
        irc.core_message(message)
    })

    irc.init()

    process.on('SIGTERM', function () {
        irc.shutdown()
    });
} else {

}

module.exports = {
    server: ["irc.wetfish.net"],
}