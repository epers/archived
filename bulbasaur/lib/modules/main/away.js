var core;

module.exports = {
    commands: ['away'],

    timeout: false,
    wait: false,

    aways: {},

    init: function (_core) {
        core = _core;
        core.user_commands["away"] = module.exports.commands
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.on(command, core.module_listeners[command]);
        });
        core.recieveEmitter.on("broadcast", module.exports.listener)
    },

    dinit: function () {
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.removeListener(command, core.module_listeners[command]);
        });
        core.recieveEmitter.removeListener("broadcast", module.exports.listener)
    },

    away: function (args, message) {
        if (!args) {
            module.exports.aways[message.from.toLowerCase()] = "No reason specified"
        } else {
            module.exports.aways[message.from.toLowerCase()] = args.join(' ')
            core.log(message.from + " has gone away with reason " + args.join(' '))
        }
    },

    listener: function (message) {
        var awaycmd = core.config.prefix + "away"
        core.log(message)
        if (message.text.split(' ')[0] != awaycmd) {
            if (message.from.toLowerCase() in module.exports.aways) {
                delete module.exports.aways[message.from.toLowerCase()];
                core.log(message.from + " has come back")
            }

            if (module.exports.aways[message.text.split(' ')[0].replace(/[:,]/, '').toLowerCase()] != undefined) {
                var timeout = module.exports.waiting(5);
                if (timeout) {
                    return;
                }
                
                var target = message.text.split(' ')[0].replace(/[:,]/, '');
                if (module.exports.aways[target.toLowerCase()] == "No reason specified") {
                    var to_say = target + " is currently away";
                } else {
                    var to_say = target + " is currently away [" + module.exports.aways[target.toLowerCase()] + ']';
                }

                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: to_say
                })
            }
        }
    },

    waiting: function (timeout) {
        if (module.exports.wait) {
            var timeout = (module.exports.timeout.getTime() - new Date().getTime()) / 1000;
            return timeout;
        }

        if (typeof timeout == "undefined")
            timeout = 1;

        var date = new Date();
        module.exports.timeout = new Date(date.getTime() + (timeout * 60 * 1000));

        module.exports.wait = setTimeout(function () {
            module.exports.wait = false;
            module.exports.timeout = false;
        }, timeout * 60 * 1000)
    }
}