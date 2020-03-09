module.exports = {
    connections: [
        wetfish = {
            name: 'wetfish',
            server: 'irc.wetfish.net',
            port: 6697,
            nick: 'Porygon-dev',
            channels: ['#botspam', '#porygon'],
            ssl: true
        },
        soupwhale = {
            server: "irc.soupwhale.com",
            nick: "Porygon-dev",
            channels: ["#porygon"],
            ssl: false,
            port: 6667
        },

        /* wetfish = {
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
}
