const mathjs = require('mathjs');

var core;

module.exports = {
    commands: ['c'],

    init: function (_core) {
        core = _core;
        core.user_commands["calc"] = module.exports.commands
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

    c: function (args, message) {
        args = args.join(' ');

        var parser = mathjs.parser();
        try {
            var to_say = mathjs.format(parser.eval(args), {
                precision: 14
            }).replace("undefined", "Error parsing input");
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: to_say
            });
        } catch (e) {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: "Error parsing input."
            });
        }
    }
}