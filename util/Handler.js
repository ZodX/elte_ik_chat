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
            /**
             * When a socket connects to a room,
             * the user is created with a custom personalID,
             * and inserts it to the proper room
             */
            socket.on('join', (req) => {
                /**
                 * Validation
                 */
                if (this.val.validate(this.val.joinSchema, req)) {
                    /**
                     * Checks if the user is in the database
                     */
                    if (this.users.get(req.socketID) == null) {
                        var personalID;
                        /**
                         * Checks if the room exists or not
                         */
                        if (this.rooms.get(req.room) == null) {
                            /**
                             * Empty room
                             */
                            var room = new Room();
                            var user = new User(req.nickname);
                            personalID = user.getPersonalID();
                            /**
                             * Add the user to the specific room
                             */
                            room.addUser(user.getPersonalID());
                            this.rooms.set(req.room, room);
                            this.users.set(req.socketID, user);
                            /**
                             * Emits to the specific users
                             */
                            socket.join(req.room);
                            this.io.to(req.room).emit('join', {
                                nickname: req.nickname,
                                personalID: user.getPersonalID(),
                                room:req.room
                            });
                            /**
                             * Refreshing rooms for all users
                             * in case of new room
                             */
                            this.io.emit('refresh');
                        } else {
                            /**
                             * Room exists
                             */
                            room = this.rooms.get(req.room);
                            user = new User(req.nickname);
                            personalID = user.getPersonalID();
                            /**
                             * Add the user to the specific room
                             */
                            room.addUser(user.getPersonalID());
                            this.users.set(req.socketID, user);
                            /**
                             * Emits to the specific users
                             */
                            socket.join(req.room);
                            this.io.to(req.room).emit('join', {
                                nickname: req.nickname,
                                personalID: user.getPersonalID(),
                                room:req.room
                            });
                        }
                        /**
                         * Sends back the personalID because
                         * of the message detection
                         */
                        this.io.to(`${req.socketID}`).emit('personalID', {
                            personalID: personalID
                        });
                    }
                }
            });
            /**
             * Disconnects and removes user from the database
             */
            socket.on('disconnect', () => {
                if (this.users.get(socket.id) != null) {
                    var user = this.users.get(socket.id);
                    var personalID = user.getPersonalID();
                    var roomNameToEmit = null;
                    /**
                     * Removes the room if it is created and empty
                     */
                    for (var roomName of this.rooms.keys()) {
                        var room = this.rooms.get(roomName);
                        if (room.getUsers().includes(personalID)) {
                            roomNameToEmit = roomName;
                            room.removeUser(personalID);
                            /**
                             * If the room is empty, and
                             * it's not part of the default rooms delete it
                             */
                            if (room.length() == 0 && !this.defaultRooms.includes(roomName)) {
                                this.rooms.remove(roomName);
                                this.io.emit('refresh');
                            }
                        }
                    }
                    this.users.remove(socket.id);
                    /**
                     * Emits to the users
                     */
                    this.io.to(roomNameToEmit).emit('quit', {
                        nickname: user.getNickname(),
                        personalID: user.getPersonalID()
                    });
                }
            });
            /**
             * Sends a message to the room that
             * the user is currently in
             */
            socket.on('message', (req) => {
                /**
                 * Validation
                 */
                if (this.val.validate(this.val.messageSchema, req)) {
                    /**
                     * Checks if the user exists in the database
                     */
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var personalID = user.getPersonalID();
                        /**
                         * Sends a message to all rooms that the user is in
                         */
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
            /**
             * Changes the user is nickname
             */
            socket.on('nickname', (req) => {
                /**
                 * Validation
                 */
                if (this.val.validate(this.val.nicknameSchema)) {
                    /**
                     * Checks if the user is in the database
                     */
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var personalID = user.getPersonalID();
                        /**
                         * Checks if the nickname is not the same as the current
                         */
                        if (user.getNickname() != req.new) {
                            var oldNickname = user.getNickname();
                            user.setNickname(req.new);
                            /**
                             * Emis to the users
                             */
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
            /**
             * Switches to an existing,or a new room
             */
            socket.on('room', (req) => {
                /**
                 * Validation
                 */
                if (this.val.validate(this.val.roomSchema, req)) {
                    /**
                     * Checks if the user is in the database
                     */
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var personalID = user.getPersonalID();
                        var roomOld = null;
                        /**
                         * Refreshes rooms
                         */
                        for (var roomName of this.rooms.keys()) {
                            var room = this.rooms.get(roomName);
                            if (room.getUsers().includes(personalID)) {
                                roomOld = roomName;
                            }
                        }
                        /**
                         * Checks if the room is the same as the current
                         */
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
                                    personalID: user.getPersonalID(),
                                    room:newRoomName
                                });
                                this.io.emit('refresh');
                            } else {
                                /**
                                 * Room exists
                                 */
                                room = this.rooms.get(newRoomName);

                                room.addUser(user.getPersonalID());

                                socket.join(newRoomName);
                                this.io.to(newRoomName).emit('join', {
                                    nickname: user.getNickname(),
                                    personalID: user.getPersonalID(),
                                    room:newRoomName
                                });
                            }
                        }
                    }
                }
            });
            /**
             * Sends a private message to a user
             */
            socket.on('private', (req) => {
                /**
                 * Validation
                 */
                if (this.val.validate(this.val.privateSchema, req)) {
                    /**
                     * Check if the user exists in the database
                     */
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var to = null;
                        /**
                         * Finds the user
                         */
                        for (var socketID of this.users.keys()) {
                            var toUser = this.users.get(socketID);
                            if (toUser.getPersonalID() == req.personalID) {
                                to = socketID;
                            }
                        }
                        /**
                         * Emits the message to it
                         */
                        this.io.to(`${to}`).emit('private', {
                            nickname: user.getNickname(),
                            personalID: user.getPersonalID(),
                            message: req.message
                        });
                    }
                }
            });
            /**
             * Sends an media file to the users in the room
             */
            socket.on('image', (req) => {
                /**
                 * Validation
                 */
                if (this.val.validate(this.val.imageSchema, req)) {
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        var personalID = user.getPersonalID();
                        /**
                         * Sends to all the users
                         */
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
            /**
             * Sends a captcha to everyone
             */
            socket.on('captcha', (req) => {
                /**
                 * Validation
                 */
                if (this.val.validate(this.val.captchaSchema, req)) {
                    /**
                     * Checks if the user exists in the database
                     */
                    if (this.users.get(req.socketID) != null) {
                        var user = this.users.get(req.socketID);
                        /**
                         * Emits to all users
                         */
                        this.io.emit('captcha', {
                            personalID: user.getPersonalID(),
                            captcha: req.captcha.toUpperCase(),
                            for: req.for
                        });
                    }
                }
            });
            /**
             * Gives back all the messages from the room
             */
            socket.on('messages', (req) => {
                /**
                 * Validation
                 */
                if (this.val.validate(this.val.messagesSchema, req)) {
                    /**
                     * Checks if the user exists in the database
                     */
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
                        /**
                         * Emits the messages
                         */
                        var joinedRoom = this.rooms.get(name);
                        if (!this.defaultRooms.includes(name)) {
                            this.io.to(`${req.socketID}`).emit('messages', {
                                messages: joinedRoom.getMessages()
                            });
                        }
                    }
                }
            });
            /**
             * Gives back all the users available
             * to the specific user
             */
            socket.on('users', (req) => {
                if (this.val.validate(this.val.usersSchema, req)) {
                    this.io.to(`${socket.id}`).emit('users', {
                        users: this.users.values()
                    });
                }
            });
            /**
             * Gives back all the rooms available
             * to the specific user
             */
            socket.on('rooms', (req) => {
                if (this.val.validate(this.val.roomsSchema, req)) {
                    const availableRooms = [];
                    this.rooms.forEach((value, key) => {
                        const availableRoom = {};
                        availableRoom.name = key;
                        availableRoom.users = value.users;
                        availableRooms.push(availableRoom);
                    });

                    this.io.to(`${req.socketID}`).emit('rooms', availableRooms);
                }
            });
        });

        /**
         * Terminal database status
         */
        setInterval(() => {
            console.clear();
            console.log(this.users.entries());
            console.log(this.rooms.keys());
            console.log(this.rooms.values());
        }, 1000);
    }
}
module.exports = Handler;