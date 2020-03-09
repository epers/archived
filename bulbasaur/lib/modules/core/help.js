var core;

module.exports = {
    commands: [
        "help"
    ],
    
    init: function (_core) {
        core = _core;
        core.user_commands["help"] = module.exports.commands
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.on(command, core.module_listeners[command]);
        });
    },
    
    dinit: function () {
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.removeListener(command, core.module_listeners[command]);
        });
    },

    help: function(args, message) {
        //list all loaded modules and their commands in a pm
        Object.keys(core.user_commands).forEach(function (module) {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.from,
                type: message.type,
                text: module + ": " + core.user_commands[module].join(' ')
            });
        });
        core.sendEmitter.emit(message.server, {
            command: 'say',
            to: message.from,
            type: message.type,
            text: "Source available at https://github.com/epers/porygon"
        });

    }
}
