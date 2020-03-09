// normal message from irc module to message router
// will be sent onward to the proper command modules
message = {
    direction: "in",
    platform: "irc",
    server: "irc.wetfish.net",
    reply_to: "#porygon",
    from: "Weazzy",
    text: ".echo foo bar baz",
    type: "chanmsg",
    command: null, // these values will be filled in by the router
    args: null,
    raw: {
        type: 'privmsg',
        nick: 'Weazzy',
        ident: 'Weazzy',
        hostname: 'Fish-hv1.ceo.172.163.IP',
        target: '#porygon',
        message: '.echo foo bar baz',
        tags: {}
    },
}

// outbound message from a module to the router
// will be sent onward to the proper server module
message = {
    direction: "out",
    server: "irc.wetfish.net",
    type: "chanmsg", // command for stuff like connect disconnect join part listchannels etc
    target: "#porygon",
    text: "foo bar baz",
}

// message from the irc master to the irc workers
message = {
    command: "say", // if chanmsg or privmsg
    target: message.target,
    text: message.text
}

// message from the irc worker to the irc master
message = {
    type: 'message',
    server: 'irc.wetfish.net',
    raw: {
        type: 'privmsg',
        nick: 'Weazzy',
        ident: 'Weazzy',
        hostname: 'Fish-hv1.ceo.172.163.IP',
        target: '#porygon',
        message: 'good bot',
        tags: {}
    }
}

// internal message from one of the modules to core - loading/unloading modules
message = {
    direction: "internal",
    command: "load", //unload, reload
    ident: "irc"
}

// command message from core to a connection worker
message = {
    direction: "internal",
    command: "disconnect",
    ident: "irc.wetfish.net"
}