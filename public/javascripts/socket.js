const socket = io();

socket.on('join', (res) => {
    console.info('JOIN');
    console.log(res);
});

socket.on('quit', (res) => {
    console.info('QUIT');
    console.log(res);
});

socket.on('message', (res) => {
    console.info('MESSAGE');
    console.log(res);
});

socket.on('nickname', (res) => {
    console.info('NICKNAME');
    console.log(res);
});

socket.on('private', (res) => {
    console.info('PRIVATE');
    console.log(res);
});

socket.on('captcha', (res) => {
    console.info('CAPTCHA');
    console.log(res);
});

socket.on('messages', (res) => {
    console.info('MESSAGES');
    console.log(res);
});

socket.on('image', (res) => {
    console.info('IMAGE');
    var img = document.createElement('img');
    img.setAttribute('src', res.data);
    document.body.appendChild(img);
});

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