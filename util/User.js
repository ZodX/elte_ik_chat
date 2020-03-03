const uniqid = require('uniqid');
class User {

    constructor(nickname = 'Unknown') {
        this.nickname = nickname;
        this.personalID = uniqid.time();
    }

    getNickname() {
        return this.nickname;
    }

    getPersonalID() {
        return this.personalID;
    }

    setNickname(newNickname) {
        this.nickname = newNickname;
    }

}
module.exports = User;