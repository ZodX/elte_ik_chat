const SocketAntiSpam = require('socket-anti-spam');
class AntiSpammer {

    constructor(io) {
        this.socketAntiSpam = new SocketAntiSpam({
            banTime: 30, // Ban time in minutes
            kickThreshold: 2, // User gets kicked after this many spam score
            kickTimesBeforeBan: 2, // User gets banned after this many kicks
            banning: true, // Uses temp IP banning after kickTimesBeforeBan
            io: io, // Bind the socket.io variable
        });
    }

    listen() {
        this.socketAntiSpam.event.on('kick', (socket) => {
            console.log(`${socket.id}: Kicked from the chat.`);
        });

        this.socketAntiSpam.event.on('ban', (socket) => {
            console.log(`${socket.id}: Banned from the chat.`);
        });
    }
}
module.exports = AntiSpammer;