const fork = require('child_process').fork;
module.exports = {
    config: require(process.cwd() + "/etc/modules/core/irc.js"),
    irc_workers: [],
    
    init: function (core) {
        // foreach connection in config, spawn connection
        Object.keys(module.exports.config.connections).forEach(function (connection) {
            module.exports.connect(core, connection);
        });
    },
    
    dinit: function() {
        Object.keys(module.exports.config.connections).forEach(function (connection) {
            module.exports.irc_workers[module.exports.config.connections[connection].name].send({
                type: 'command',
                command: 'quit',
                text: "Porygon IRCLink v1.0.0"
            });
        });
        delete require.cache[process.cwd() + "/etc/modules/core/irc.js"]
    },
    
    connect: function (core, connection) {
        module.exports.irc_workers[module.exports.config.connections[connection].name] = fork(process.cwd() + '/lib/modules/core/irc_worker.js', [
            `-s ${module.exports.config.connections[connection].server}`,
            `-p ${module.exports.config.connections[connection].port}`,
            `-n ${module.exports.config.connections[connection].nick}`,
            `-c ${module.exports.config.connections[connection].channels}`,
            `-t ${module.exports.config.connections[connection].ssl}`
        ], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        });
        
        module.exports.irc_workers[module.exports.config.connections[connection].name].on('message', function (message) {
            if (message.type == 'error') {
                core.error(message);
            }
            if (message.type == 'log') {
                core.log(message);
            }
            if (message.type == 'message') {
                var type
                if (message.raw.target.slice(0, 1) == '#') {
                    type = 'chanmsg'
                    var reply_to = message.raw.target
                } else {
                    type = 'privmsg'
                    var reply_to = message.raw.nick
                }
                
                // preparse the message into the expected format
                core.parse_message({
                    from: message.raw.nick,
                    reply_to: reply_to,
                    text: message.raw.message,
                    platform: 'irc',
                    server: message.server,
                    type: type,
                    raw: message.raw
                });
            }
        });
        
        module.exports.irc_workers[module.exports.config.connections[connection].name].on('exit', function (code) {
            if (code == 0) {
                core.log(module.exports.config.connections[connection].name + " irc exited with code " + code);
            } else {
                core.error(module.exports.config.connections[connection].name + " irc exited with code " + code);
            }
        });
        
        module.exports.irc_workers[module.exports.config.connections[connection].name].on('stderr', function (stderr) {
            core.error(module.exports.config.connections[connection].name + " irc exited with code " + stderr)
        });
        
        module.exports.irc_workers[module.exports.config.connections[connection].name].on('stdout', function (stdout) {
            core.log(module.exports.config.connections[connection].name + "stdout:");
            core.log(stdout)
        });
        
        // setup other listeners
        
        // command receiver (say, join, part, connect, disconnect, etc)
        core.sendEmitter.on(module.exports.config.connections[connection].server, function (message) {
            // send the message
            module.exports.irc_workers[module.exports.config.connections[connection].name].send({
                type: 'command',
                command: message.command,
                to: message.to,
                text: message.text
            });
        });
    },
}

