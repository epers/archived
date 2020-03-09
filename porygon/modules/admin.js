/* message = {
            direction: "internal",
            command: "load", //unload, reload
            ident: "irc"
        } */

if (require.main === module) {
    var config = {
        owner: "Weazzy"
    }
    var admin = {
        unload: function (message) {
            var to_send = {
                direction: "internal",
                type: "command",
                command: message.command,
                ident: message.args[0]
            }
            process.send(to_send)
        },
        load: function (message) {
            var to_send = {
                direction: "internal",
                type: "command",
                command: message.command,
                ident: message.args[0]
            }
            process.send(to_send)
        },

        reload: function(message) {
            var to_send = {
                direction: "internal",
                type: "command",
                command: message.command,
                ident: message.args[0]
            }
            process.send(to_send)
        },

        disconnect: function(message) {
            var to_send = {
                direction: "internal",
                type: "command",
                command: message.command,
                server: message.args[0],
                text: message.args
            }
            process.send(to_send)
        },

        join: function(message) {
            var to_send = {
                direction: "internal",
                type: "command",
                command: message.command,
                text: message.args,
                server: message.server
            }
            process.send(to_send)
        },

        part: function(message) {
            var to_send = {
                direction: "internal",
                type: "command",
                command: message.command,
                text: message.args,
                server: message.server
            }
            process.send(to_send)
        },

        listchannels: function(message) {
            var to_send = {
                direction: "internal",
                type: "command",
                command: message.command,
                text: message.args,
                server: message.server
            }
            process.send(to_send)
        },

        prefix: function(message) {
            var to_send = {
                direction: "internal",
                type: "command",
                command: message.command,
                text: message.args,
                server: message.server
            }
            process.send(to_send)
        }


    }
    process.on("message", function (message) {
        // TODO: make this more better
        if (message.from == config.owner) {
            admin[message.command](message)
        }
    })
} else {

}

module.exports = {
    commands: [
        'unload',
        'load',
        'reload',
        'disconnect',
        'join',
        'part',
        'prefix'
    ],
}