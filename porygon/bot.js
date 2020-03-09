const fork = require('child_process').fork
const events = require('events')

var core = {
    messageEmitter: new events.EventEmitter(),

    modules_loaded: [],
    child_processes: [],
    child_senders: [],
    config: {
        prefix: "~",
        modules: ['irc/irc', 'test', 'admin', 'calc',]
    },

    init: function () {
        // figure out what modules we're loading at boot
        core.config.modules.forEach(function (module) {
            // and load them
            core.load_module(module)
        })
    },

    load_module: function (ident) {
        try {
            if (core.child_processes[ident] || core.modules_loaded[ident] || core.child_senders[ident]) {
                console.log(ident + " is already loaded")
                return
            }
            var path = `${process.cwd()}/modules/${ident}.js`

            // fork and require
            core.child_processes[ident] = fork(path, [], {
                stdio: ['inherit', 'inherit', 'inherit', 'ipc']
            })
            core.modules_loaded[ident] = require(path)
            core.child_senders[ident] = function (message) {
                core.child_processes[ident].send(message)
            }

            // does the module have any commands?
            if (core.modules_loaded[ident].commands) {
                core.modules_loaded[ident].commands.forEach(function (command) {
                    // setup a listener for each one
                    core.messageEmitter.on(command, core.child_senders[ident])
                })
            }

            // does the module want to listen to broadcasts?
            if (core.modules_loaded[ident].broadcast) {
                core.messageEmitter.on("broadcast", core.child_senders[ident])
            }

            // is the module a server connection?
            if (core.modules_loaded[ident].server) {
                core.modules_loaded[ident].server.forEach(function (server) {
                    // setup a listener for each one
                    core.messageEmitter.on(server, core.child_senders[ident])
                })
            }

            // when the module sends core a message, pass it to the message router
            core.child_processes[ident].on("message", core.message_router)
            console.log("loaded " + ident)
        } catch (error) {
            console.log(error)
        }
    },

    unload_module: function (ident) {

        try {
            var path = `${process.cwd()}/modules/${ident}.js`

            core.child_processes[ident].kill()

            // does the module have any commands?
            if (core.modules_loaded[ident].commands) {
                core.modules_loaded[ident].commands.forEach(function (command) {
                    // tear down the listener for each one
                    core.messageEmitter.removeListener(command, core.child_senders[ident])
                })
            }

            // does the module want to listen to broadcasts?
            if (core.modules_loaded[ident].broadcast) {
                core.messageEmitter.removeListener("broadcast", core.child_senders[ident])
            }

            // is the module a server connection?
            if (core.modules_loaded[ident].server) {
                core.messageEmitter.removeListener(core.modules_loaded[ident].server, core.child_senders[ident])
            }

            delete core.child_processes[ident]
            delete core.modules_loaded[ident]
            delete require.cache[path]
            delete core.child_senders[ident]
            console.log("unloaded " + ident)
        } catch (error) {
            console.log(error)
        }
    },

    reload_module: function (ident) {
        core.unload_module(ident)
        core.load_module(ident)
    },

    message_router: function (message) {
        if (message.direction == "in") {
            try {
                // emit a broadcast
                core.messageEmitter.emit("broadcast", message)

                // check for our command prefix (stored in core.config.prefix)
                if (message.text.slice(0, core.config.prefix.length) == core.config.prefix) {
                    // set message.command to the command
                    message.command = message.text.slice(core.config.prefix.length).split(' ')[0]
                    // set message.args to an array of arguments provided
                    message.args = message.text.slice(core.config.prefix.length).split(' ').slice(1)
                    core.messageEmitter.emit([message.command], message)
                    console.log("command detected")
                    console.log(message.command)
                    console.log(message.args)
                }
            } catch (error) {
                console.log("ERROR in incoming router")
                console.log(error)
            }
        } else if (message.direction == "out") {
            try {
                core.messageEmitter.emit(message.server, message)
            } catch (error) {
                console.log("ERROR in outgoing router")
                console.log(error)
            }
        } else if (message.direction == "internal") {
            // TODO: make this more elegant
            if (message.command == "load") {
                // load the requested module
                core.load_module(message.ident)
            } else if (message.command == "unload") {
                // unload the requested module
                core.unload_module(message.ident)
            } else if (message.command == "reload") {
                console.log("here")
                // reload the requested module
                console.log(message.ident)
                /* core.child_processes[message.ident].send({
                    command: "shutdown",
                    type: "command"
                }) */
                core.unload_module(message.ident)
                /* setTimeout(function() {
                    core.load_module(message.ident)
                }, 1000); */
                core.load_module(message.ident)
                
            } else if (message.command == "prefix") {
                console.log("prefix")
                console.log(message.text)
                message.type = "command"
                core.config.prefix = message.text.join(' ')
            } else {
                core.messageEmitter.emit(message.server, message)
            }

        }
        //console.log(message)
    },
}

core.init()