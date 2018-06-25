//app.js
let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server, {});
 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
app.use('/assets', express.static(__dirname + '/assets'));

server.listen(3000);
 
let socket_list = {};
let player_list = {};
let ball_list = []; 

let Ball = id => { 
    let self = { 
        x: 100, 
        y: 100, 
        speed: 3, 
        xVel: 5, 
        yVel: 5, 
        id: id 
    } 
    self.updatePosition = (player) => { 
        self.x += self.xVel + self.speed; 
        self.y += self.yVel + self.speed; 
        if (self.x < 0 && self.xVel < 0) { 
            self.xVel = -self.xVel; 
        } 
        if (self.x > 250 && self.xVel > 0) { 
            self.xVel = -self.xVel; 
        } 
         
        // (Ball's) Collision with player 
        if (self.x >= player.x && self.x <= player.x + 2) { 
            if (self.y >= player.y) { 
                player.score += 1; 
                self.yVel = -self.yVel; 
                // increase speed - postponed/cancelled 
            } 
        }  
        if (self.y <= 0) { 
            self.yVel = -self.yVel; 
        } 
        if (self.y >= 300) { 
            player.score = 0; 
            self.y = 50; 
        }
    } 
    return self; 
}

let Player = id => {
    let self = {
        x: 100,
        y: 200,
        score: 0, 
        id:id,
        number: "" + Math.floor(10 * Math.random()),
        pressingRight: false,
        pressingLeft: false,
        pressingUp: false,
        pressingDown: false,
        speed: 5,  
        color: "" 
    } 
    /* 
    self.getX = (x) => { 
        /* 
        if (self.x >= 45) {
            self.x += self.speed; 
        }  *  
        // self.x = x; 
        // self.x = x; 
        // console.log("X "+x); 
        // self.updatePosition(x); 
    } */ 
    self.updatePosition = (x) => { 
        if (x) { 
            self.x = x; 
        } else { 
            if (self.pressingRight) { 
                self.x += self.speed;
            } 
            if (self.pressingLeft) { 
                self.x -= self.speed; 
            } 
        } 
    }
    return self;
}
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    socket_list[socket.id] = socket;
 
    let player = Player(socket.id); 
    let ball = Ball(socket.id); 
    ball_list[socket.id] = ball; 
    player_list[socket.id] = player;
   
    socket.on('disconnect', () => {
        delete socket_list[socket.id];
        delete player_list[socket.id];
        delete ball_list[socket.id];
    });
    
    socket.on('keyPress', data => {
        if (data.inputId === 'left')
            player.pressingLeft = data.state;
        else if (data.inputId === 'right')
            player.pressingRight = data.state;
    });   
    
   socket.on("mobile", data => { 
        // console.log("Mobile"); 
        // console.log(JSON.stringify(data)); 
        x = data; 
        player.updatePosition(x); 
    });   

});
 
setInterval(() => {
    let package = [];
    for(let i in player_list) {
        let player = player_list[i];
        let ball = ball_list[i];
        player.updatePosition(); 
        ball.updatePosition(player); 
        package.push({player: player, ball: ball});    
        // package.push({ball: ball}); 
    } 
    for (let i in socket_list) {
        let socket = socket_list[i]; 
        socket.emit('updateGame', package); // updateGame = redraw 
    } 
}, 1000/25);
