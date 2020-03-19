const socket = io();
var nickname = "Unknown";
var availableRooms = null;
var availableUsers = null;
var myPersonalID = null;
var recievedMessage = null;
var newRoom = null;

socket.on('connect', () => {
    rooms();
});

function getParameter(property) {
    const url = new URL(window.location.href);
    const p = url.searchParams.get(property);
    return p;
}

function makeRooms() {
    const rooms = document.getElementsByClassName("rooms")[0];
    var drawer = "";
    rooms.innerHTML = "";
    for (var room of availableRooms) {
        drawer = `
                    <div class="room-drawer" onclick="">
                        <div class="room-name">${room.name}</div>
                        <div class="room-button">
                            <i class="material-icons">add_circle_outline</i>
                        </div>
                    </div>
                `;
        rooms.innerHTML += drawer;
    }
}

function makeMessages() {
    const chat_panel = document.getElementsByClassName("chat-panel")[0];
    var bubble = "";
    chat_panel.innerHTML = "";
    for (var bub of messageHistory.messages) {
        bubble = `
                    <div class="chat-bubble-left">
                        <div class="content">${bub.message}</div>
                    </div>
                `;

        chat_panel.innerHTML += bubble;
    }
}

function makeMessage() {
    const chat_panel = document.getElementsByClassName("chat-panel")[0];
    var bubble = "";
    if (myPersonalID == recievedMessage.personalID) {
        bubble = `
                    <div class="chat-bubble-right">
                        <div class="content">${recievedMessage.message}</div>
                    </div>
                `;
    } else {
        bubble = `
                    <div class="chat-bubble-left">
                        <div class="content">${recievedMessage.message}</div>
                    </div>
                `;
    }

    chat_panel.innerHTML += bubble;
}

socket.on('personalID', (res) => {

    console.log(res);
    myPersonalID = res.personalID;
});

socket.on('join', (res) => {
    console.info('JOIN');
    rooms();
    if (res.personalID == myPersonalID) {
        messages();
    }
    console.log(res);
});

socket.on('quit', (res) => {
    console.info('QUIT');
    rooms();
});

socket.on('message', (res) => {
    console.info('MESSAGE');
    console.log(res);
    recievedMessage = res;
    makeMessage();
});

socket.on('nickname', (res) => {
    console.info('NICKNAME');
});

socket.on('private', (res) => {
    console.info('PRIVATE');
});

socket.on('captcha', (res) => {
    console.info('CAPTCHA');
});

socket.on('messages', (res) => {
    console.info('MESSAGES');
    messageHistory = res;
    console.log(messageHistory);
    makeMessages();
});

socket.on('ban', (res) => {
    console.info('BAN');
    window.location.href = '/jail';
});

socket.on('users', (res) => {
    console.info('USERS');
});

socket.on('rooms', (res) => {
    console.info('ROOMS');
    availableRooms = res;
    makeRooms();
});

socket.on('refresh', () => {
    rooms();
});

socket.on('image', (res) => {
    console.info('IMAGE');
    var img = document.createElement('img');
    img.setAttribute('src', res.data);
    document.body.appendChild(img);
});

function users() {
    socket.emit('users', {
        socketID: socket.id
    });
}

function rooms() {
    socket.emit('rooms', {
        socketID: socket.id
    });
}

function join(room, nickname) {
    socket.emit('join', {
        socketID: socket.id,
        nickname: nickname,
        room: room
    });
}

function message(message) {
    socket.emit('message', {
        socketID: socket.id,
        message: message
    });
}

function nickname(nickname) {
    socket.emit('nickname', {
        socketID: socket.id,
        new: nickname
    });
}

function room(room) {
    socket.emit('room', {
        socketID: socket.id,
        room: room
    });
}

function private(to, message) {
    socket.emit('private', {
        socketID: socket.id,
        personalID: to,
        message: message
    });
}

function image() {
    var file = document.getElementById('image').files[0];
    var reader = new FileReader();
    reader.onloadend = function () {
        socket.emit('image', {
            socketID: socket.id,
            data: reader.result
        });
    }
    reader.readAsDataURL(file);
}

function captcha(captcha, where) {
    socket.emit('captcha', {
        socketID: socket.id,
        captcha: captcha,
        for: where
    });
}

function messages() {
    socket.emit('messages', {
        socketID: socket.id
    });
}