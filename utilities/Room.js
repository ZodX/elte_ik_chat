class Room {

    constructor() {
        this.users = [];
        this.messages = [];
    }

    addUser(personalID) {
        if (this.users.includes(personalID)) {
            throw new Error(`This personalID(${personalID}) is already exists in the list.`);
        } else {
            this.users.push(personalID);
        }
    }

    addMessage(messageData) {
        this.messages.push(messageData);
    }

    removeUser(personalID) {
        if (this.users.includes(personalID)) {
            this.users.splice(this.users.indexOf(personalID), 1);
        } else {
            throw new Error(`This personalID(${personalID}) does not exist in the list.`);
        }
    }

    getUsers() {
        return this.users;
    }

    getMessages() {
        return this.messages;
    }

    length() {
        return this.users.length;
    }
}
module.exports = Room;