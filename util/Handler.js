const User = require('./User');
const Room = require('./Room');
const Validator = require('./Validator');
const HashMap = require('hashmap');
class Handler {

    constructor(io) {
        this.io = io;
        this.users = new HashMap();
        this.defaultRooms = ['Lobby'];
        this.rooms = new HashMap().set('Lobby', new Room());
        this.val = new Validator();
    }

    listen() {
        this.io.sockets.on('connection', (socket) => {

            socket.on('join', (req) => {
                if (this.val.validate(this.val.joinSchema, req)) {
                    if (this.users.get(req.socketID) == null) {
                        if (this.rooms.get(req.room) == null) {
                            /**
                             * Empty room
                             */
                            var room = new Room();
                            var user = new User(req.nickname);

                            room.addUser(user.getPersonalID());
                            this.rooms.set(req.room, room);
                            this.users.set(req.socketID, user);

                            socket.join(req.room);
                            this.io.to(req.room).emit('join', {
                                nickname: req.nickname,
                                personalID: user.getPersonalID()
                            });
                        } else {
                            /**
                             * Room exists
                             */
                            room = this.rooms.get(req.room);
                            user = new User(req.nickname);

                            room.addUser(user.getPersonalID());
                            this.users.set(req.socketID, user);

                            socket.join(req.room);
                            this.io.to(req.room).emit('join', {
                                nickname: req.nickname,
                                personalID: user.getPersonalID()
                            });
                        }
                    }
                }
            });

            socket.on('disconnect', () => {
                if (this.users.get(socket.id) != null) {
                    var user = this.users.get(socket.id);
                    var personalID = user.getPersonalID();
                    var roomNameToEmit = null;

                    for (var roomName of this.rooms.keys()) {
                        var room = this.rooms.get(roomName);
                        if (room.getUsers().includes(personalID)) {
                            roomNameToEmit = roomName;
                            room.removeUser(personalID);
                            /**
                             * If the room is empty, and
                             * it's not part of the default rooms.
                             */
                            if (room.length() == 0 && !this.defaultRooms.includes(roomName)) {
                                this.rooms.remove(roomName);
                            }
                        }
                    }
                    this.users.remove(socket.id);

                    this.io.to(roomNameToEmit).emit('quit', {
                        nickname: user.getNickname(),
                        personalID: user.getPersonalID()
                    });
                }
            });

            socket.on('message', (req) => {
                if (this.val.validate(this.val.messageSchema, req)) {
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var personalID = user.getPersonalID();

                        for (var roomName of this.rooms.keys()) {
                            var room = this.rooms.get(roomName);
                            if (room.getUsers().includes(personalID)) {
                                this.io.to(roomName).emit('message', {
                                    nickname: user.getNickname(),
                                    personalID: user.getPersonalID(),
                                    message: req.message
                                });
                                if (!this.defaultRooms.includes(roomName)) {
                                    room.addMessage({
                                        nickname: user.getNickname(),
                                        message: req.message
                                    });
                                }
                            }
                        }
                    }
                }
            });

            socket.on('nickname', (req) => {
                if (this.val.validate(this.val.nicknameSchema)) {
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var personalID = user.getPersonalID();
                        if (user.getNickname() != req.new) {
                            var oldNickname = user.getNickname();
                            user.setNickname(req.new);

                            for (var roomName of this.rooms.keys()) {
                                var room = this.rooms.get(roomName);
                                if (room.getUsers().includes(personalID)) {
                                    this.io.to(roomName).emit('nickname', {
                                        personalID: user.getPersonalID(),
                                        old: oldNickname,
                                        new: user.getNickname()
                                    });
                                }
                            }
                        }
                    }
                }
            });

            socket.on('room', (req) => {
                if (this.val.validate(this.val.roomSchema, req)) {
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var personalID = user.getPersonalID();
                        var roomOld = null;

                        for (var roomName of this.rooms.keys()) {
                            var room = this.rooms.get(roomName);
                            if (room.getUsers().includes(personalID)) {
                                roomOld = roomName;
                            }
                        }

                        if (roomOld != req.room) {
                            var newRoomName = req.room;
                            var oldRoom = this.rooms.get(roomOld);

                            oldRoom.removeUser(personalID);
                            socket.leave(roomOld);
                            if (oldRoom.length() == 0 && !this.defaultRooms.includes(roomOld)) {
                                this.rooms.remove(roomOld);
                            } else {
                                this.io.to(roomOld).emit('quit', {
                                    nickname: user.getNickname(),
                                    personalID: user.getPersonalID()
                                });
                            }

                            if (this.rooms.get(newRoomName) == null) {
                                /**
                                 * Empty room
                                 */
                                room = new Room();

                                room.addUser(user.getPersonalID());
                                this.rooms.set(newRoomName, room);

                                socket.join(newRoomName);
                                this.io.to(newRoomName).emit('join', {
                                    nickname: user.getNickname(),
                                    personalID: user.getPersonalID()
                                });
                            } else {
                                /**
                                 * Room exists
                                 */
                                room = this.rooms.get(newRoomName);

                                room.addUser(user.getPersonalID());

                                socket.join(newRoomName);
                                this.io.to(newRoomName).emit('join', {
                                    nickname: user.getNickname(),
                                    personalID: user.getPersonalID()
                                });
                            }
                        }
                    }
                }
            });

            socket.on('private', (req) => {
                if (this.val.validate(this.val.privateSchema, req)) {
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var to = null;

                        for (var socketID of this.users.keys()) {
                            var toUser = this.users.get(socketID);
                            if (toUser.getPersonalID() == req.personalID) {
                                to = socketID;
                            }
                        }

                        this.io.to(`${to}`).emit('private', {
                            nickname: user.getNickname(),
                            personalID: user.getPersonalID(),
                            message: req.message
                        });
                    }
                }
            });

            socket.on('image', (req) => {
                if (this.val.validate(this.val.imageSchema, req)) {
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var personalID = user.getPersonalID();

                        for (var roomName of this.rooms.keys()) {
                            var room = this.rooms.get(roomName);
                            if (room.getUsers().includes(personalID)) {
                                this.io.to(roomName).emit('image', {
                                    nickname: user.getNickname(),
                                    personalID: user.getPersonalID(),
                                    data: req.data
                                });
                            }
                        }
                    }
                }
            });

            socket.on('captcha', (req) => {
                if (this.val.validate(this.val.captchaSchema, req)) {
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);

                        this.io.emit('captcha', {
                            personalID: user.getPersonalID(),
                            captcha: req.captcha.toUpperCase(),
                            for: req.for
                        });
                    }
                }
            });

            socket.on('messages', (req) => {
                if (this.val.validate(this.val.messagesSchema, req)) {
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var personalID = user.getPersonalID();
                        var name = null;

                        for (var roomName of this.rooms.keys()) {
                            var room = this.rooms.get(roomName);
                            if (room.getUsers().includes(personalID)) {
                                name = roomName;
                            }
                        }

                        var joinedRoom = this.rooms.get(name);
                        if (!this.defaultRooms.includes(name)) {
                            this.io.to(`${req.socketID}`).emit('messages', {
                                messages: joinedRoom.getMessages()
                            });
                        }
                    }
                }
            });

            socket.on('users', (req) => {
                if (this.val.validate(this.val.usersSchema, req)) {
                    this.io.to(`${socket.id}`).emit('users', {
                        users: this.users.values()
                    });
                }
            });

            socket.on('rooms', (req) => {
                if (this.val.validate(this.val.roomsSchema, req)) {
                    const availableRooms = [];
                    this.rooms.forEach((value, key) => {
                        const availableRoom = {};
                        availableRoom.name = key;
                        availableRoom.users = value.users;
                        availableRooms.push(availableRoom);
                    });

                    this.io.to(`${socket.id}`).emit('rooms', availableRooms);
                }
            });
        });

        setInterval(() => {
            console.clear();
            console.log(this.users.entries());
            console.log(this.rooms.keys());
            console.log(this.rooms.values());
        }, 1000);
    }
}
module.exports = Handler;