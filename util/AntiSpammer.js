const SocketAntiSpam = require('socket-anti-spam');
class AntiSpammer {

    constructor(io) {
        this.io = io;
        this.bans = [];
        this.socketAntiSpam = new SocketAntiSpam({
            banTime: 30, // Ban time in minutes
            kickThreshold: 2, // User gets kicked after this many spam score
            kickTimesBeforeBan: 0, // User gets banned after this many kicks
            banning: true, // Uses temp IP banning after kickTimesBeforeBan
            io: io
        });
    }

    listen() {

        this.socketAntiSpam.event.on('authenticate', (socket) => {
            if (this.bans.includes(socket.ip)) {
                this.io.to(`${socket.id}`).emit('ban', {
                    socketID: socket.id
                });
            }
        });

        this.socketAntiSpam.event.on('ban', (socket) => {
            console.log(`${socket.id}: Banned from the chat.`);
            this.bans.push(socket.ip);
            setTimeout(() => {
                this.bans.splice(this.bans.indexOf(socket.ip), 1)
            }, 1000 * 60 * 30);

            this.io.to(`${socket.id}`).emit('ban', {
                socketID: socket.id
            });
        });

        // setInterval(() => {
        //     console.log(this.bans);
        // }, 1000);
    }
}
module.exports = AntiSpammer;