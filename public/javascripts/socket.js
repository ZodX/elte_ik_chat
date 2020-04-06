const socket = io();
var input;
var newRoomInput;
var nickname = "Unknown";
var availableRooms = null;
var availableUsers = null;
var myPersonalID = null;
var puffer = null;

document.addEventListener('DOMContentLoaded', () => {

    input = document.getElementsByClassName('input')[0];

    input.addEventListener('keyup', (event) => {
        /**
         * Enter
         */
        if (event.keyCode == 13) {
            message(input.value);
            input.value = "";
        }
    });

    document.getElementById('media').addEventListener('click', () => {
        document.getElementById('image').click();
    });

    document.getElementById('image').addEventListener('change', () => {
        image();
    });

});


socket.on('connect', () => {
    rooms();
    nickname = getUrlParameter('nickname');
    join('Lobby', nickname);
});

socket.on('personalID', (res) => {
    console.log(res);
    myPersonalID = res.personalID;
});

socket.on('join', (res) => {
    console.info('JOIN');
    rooms();

    if (res.personalID == myPersonalID && res.room == 'Lobby')
        clearMessages()
    else
    if (res.personalID == myPersonalID)
        messages();

    puffer = res;
    setRoomName();
    eventJoin();
});

socket.on('quit', (res) => {
    console.info('QUIT');
    puffer = res;
    rooms();
    eventQuit();
});

socket.on('message', (res) => {
    console.info('MESSAGE');;
    puffer = res;
    makeMessage();
});

socket.on('nickname', (res) => {
    console.info('NICKNAME');
    puffer = res;
    eventNickname();
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
    makeMessages();
});

socket.on('ban', (res) => {
    console.info('BAN');
    window.location.href = '/jail';
});

socket.on('users', (res) => {
    console.info('USERS');
    puffer = res;
    console.log(res);
    drawUsers();
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
    puffer = res;
    makeImageMessage(res.data);
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

function changeNickname(nickname) {
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

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function getParameter(property) {
    const url = new URL(window.location.href);
    const p = url.searchParams.get(property);
    return p;
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

function makeRooms() {
    const rooms = document.getElementsByClassName("rooms")[0];
    var drawer = "";
    rooms.innerHTML = "";
    for (var croom of availableRooms) {
        drawer = `
            <div class="room-drawer">
                <div class="room-name">${croom.name}</div>
                <div class="room-button">
                    <i id="asd" class="material-icons" onclick='room("${croom.name}","${nickname}")'>add_circle_outline</i>
                </div>
            </div>
        `;
        rooms.innerHTML += drawer;
    }

    newRoomInput = document.getElementById('newRoomName');
    newRoomInput.addEventListener('keyup', (event) => {
        /**
         * Enter
         */
        if (event.keyCode == 13) {
            room(newRoomInput.value);
            newRoomInput.value = '';
        }
    });

}

function setRoomName() {
    var title = document.getElementById("title");
    if (puffer.personalID == myPersonalID)
        title.innerHTML = `${puffer.room}`;
    }

function sendMessage() {
    var input = document.getElementsByClassName("input")[0];
    message(input.value);
    input.value = "";
}

function newRoom() {
    
    var avRooms = [];
    for (croom in availableRooms) {
        avRooms.push(croom.name);
    }

    if (document.getElementById("newRoomName").value in avRooms)
        alert("Room already exists.")
    else
    room(document.getElementById('newRoomName').value);
}

function makeMessage() {
    const chat_panel = document.getElementsByClassName("chat-panel")[0];
    var msg = "";
    if (myPersonalID == puffer.personalID) {
        //If the message is from the user.
        msg = `
        <div class="chat-bubble-right">
        <div class="content">${puffer.message}</div>
        </div>
        `;
    } else {
        //If the message is from another user.
        msg = `
        <div class="chat-bubble-left">
            <div id="nickname">${puffer.nickname}</div>
            <div class="contentContainer">
                <div class="content">${puffer.message}</div>
            </div>
        </div>
        `;
    }
    chat_panel.innerHTML += msg;
    chat_panel.scroll(0, chat_panel.scrollHeight);
}

function makeImageMessage(data) {
    const chat_panel = document.getElementsByClassName("chat-panel")[0];
    var msg = "";
    if (myPersonalID == puffer.personalID) {
        msg = `
        <div class="chat-bubble-right">
        <div class="content">
        <img class="image" src="${data}" alt="Image">
        </div>
        </div>
        `;
    } else {
        msg = `
        <div class="chat-bubble-left">
        <div class="content">
        <div id="nickname">${puffer.nickname}</div>
        <img class="image" src="${data}" alt="Image">
        </div>
        </div>
        `;
    }
    chat_panel.innerHTML += msg;
    chat_panel.scroll(0, chat_panel.scrollHeight);
}

function eventJoin() {
    const chat_panel = document.getElementsByClassName("chat-panel")[0];
    var drawer = `
    <div class="event">
    ${puffer.nickname} joined to the room.
    </div>
    `;

    chat_panel.innerHTML += drawer;
    chat_panel.scroll(0, chat_panel.scrollHeight);
}

function eventQuit() {
    const chat_panel = document.getElementsByClassName("chat-panel")[0];
    var drawer = `
    <div class="event">
    ${puffer.nickname} left the room.
    </div>
    `;

    chat_panel.innerHTML += drawer;
    chat_panel.scroll(0, chat_panel.scrollHeight);
}

function eventNickname() {
    const chat_panel = document.getElementsByClassName("chat-panel")[0];
    var drawer = `
    <div class="event">
    ${puffer.old} has changed it's nickname to ${puffer.new}.
    </div>
    `;

    chat_panel.innerHTML += drawer;
    chat_panel.scroll(0, chat_panel.scrollHeight);
}

function clearMessages() {
    const chat_panel = document.getElementsByClassName("chat-panel")[0];
    chat_panel.innerHTML = ``;
}

function changeList() {
    const ctitle = document.getElementsByClassName("title")[0];
    const cusers = document.getElementsByClassName("users")[0];
    const crooms = document.getElementsByClassName("rooms")[0];
    const cnewRoomCreation = document.getElementsByClassName("newRoomCreation")[0];


    if (ctitle.innerText == "Available rooms") {
        ctitle.innerText = "Online users";
        cnewRoomCreation.style.display = "none";
        crooms.style.display = "none";
        cusers.style.display = "block";
        cusers.style.height = "80%";
        users();
    } else {
        ctitle.innerText = "Available rooms";
        cnewRoomCreation.style.display = "block";
        crooms.style.display = "block";
        cusers.style.display = "none";
        rooms();
    }
    console.log(ctitle.innerText);
}

function drawUsers() {
    const users = document.getElementsByClassName("users")[0];
    users.innerHTML = "";
    var drawer = "";
    var cuser = null;
    console.log(puffer);
    for (cuser of puffer.users) {
        drawer = `
                    <div class="user-drawer">
                        <div class="user-name">${cuser.nickname}</div>
                        <div class="user-button">
                            <i class="material-icons" onclick="alertUser()">lock</i>
                        </div>
                    </div>
                `;
        users.innerHTML += drawer;
    }
}

/* function alertUser() {
    const 
} */