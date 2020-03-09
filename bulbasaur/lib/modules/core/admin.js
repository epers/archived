var core

module.exports = {
    commands: [
        'unload', 
        'load', 
        'reload', 
        'disconnect', 
        'echo', 
        'join', 
        'part',
        'listchannels', 
        'prefix'
    ],

    init: function (_core) {
        core = _core
        core.user_commands["admin"] = module.exports.commands
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.on(command, core.module_listeners[command])
        })
    },

    dinit: function () {
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.removeListener(command, core.module_listeners[command])
        })
    },

    load: function (args, message) {
        if (message.from == core.config.owner) {
            args.forEach(function (module) {
                core.load_module(module, function(result) {
                    if(result) {
                        core.sendEmitter.emit(message.server, {
                            command: 'say',
                            to: message.reply_to,
                            type: message.type,
                            text: "loaded: " + module
                        })
                    } else {
                        core.sendEmitter.emit(message.server, {
                            command: 'say',
                            to: message.reply_to,
                            type: message.type,
                            text: "error loading: " + module
                        })
                    }
                })
                
            })
        }
    },

    unload: function (args, message) {
        if (message.from == core.config.owner) {
            args.forEach(function (module) {
                core.unload_module(module)
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: "unloaded: " + module
                })
            })
        }
    },

    reload: function (args, message) {
        if (message.from == core.config.owner) {
            args.forEach(function (module) {
                core.unload_module(module)
                core.load_module(module)
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: "reloaded: " + module
                })
            })
        }
    },

    disconnect: function (args, message) {
        if (message.from == core.config.owner) {
            core.sendEmitter.emit(message.server, {
                command: 'quit',
                to: message.reply_to,
                type: message.type,
                text: args.join(' ')
            })
        }
    },

    join: function(args, message) {
        if (message.from == core.config.owner) {
            core.sendEmitter.emit(message.server, {
                command: 'join',
                to: message.reply_to,
                type: message.type,
                text: args.join(' ')
            })
        }
    },

    part: function(args, message) {
        if (message.from == core.config.owner) {
            core.sendEmitter.emit(message.server, {
                command: 'part',
                to: message.reply_to,
                type: message.type,
                text: args.join(' ')
            })
        }
    },

    echo: function (args, message) {
        if (message.from == core.config.owner) {
            args = args.join(' ')
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: args
            })
        }
    },

    listchannels: function(args, message) {
        if (message.from == core.config.owner) {
            args = args.join(' ')
            core.sendEmitter.emit(message.server, {
                command: 'listchannels',
                to: message.reply_to,
                type: message.type,
                text: args
            })
        }
    },

    prefix: function(args, message) {
        if (message.from == core.config.owner) {
            args = args.join(' ')
            core.config.prefix = args
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: "Set prefix to: " + args
            })
        }
    },
}
