const express = require('express');
const path = require('path')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server , {
    maxHttpBufferSize: 5e6,
    pingTimeout: 25000,
    pingInterval: 1000
})

app.use(express.static(path.join(__dirname, 'public')));

app.get('/' , (req , res) => {
    return res.sendFile(path.resolve(__dirname , 'public' , 'index.html'));
})


const DECK_OF_CARDS = [
    // Number cards
    { "0": "red" }, { "0": "blue" }, { "0": "green" }, { "0": "yellow" },
    
    { "1": "red" }, { "1": "red" },
    { "1": "blue" }, { "1": "blue" },
    { "1": "green" }, { "1": "green" },
    { "1": "yellow" }, { "1": "yellow" },
  
    { "2": "red" }, { "2": "red" },
    { "2": "blue" }, { "2": "blue" },
    { "2": "green" }, { "2": "green" },
    { "2": "yellow" }, { "2": "yellow" },
  
    { "3": "red" }, { "3": "red" },
    { "3": "blue" }, { "3": "blue" },
    { "3": "green" }, { "3": "green" },
    { "3": "yellow" }, { "3": "yellow" },
  
    { "4": "red" }, { "4": "red" },
    { "4": "blue" }, { "4": "blue" },
    { "4": "green" }, { "4": "green" },
    { "4": "yellow" }, { "4": "yellow" },
  
    { "5": "red" }, { "5": "red" },
    { "5": "blue" }, { "5": "blue" },
    { "5": "green" }, { "5": "green" },
    { "5": "yellow" }, { "5": "yellow" },
  
    { "6": "red" }, { "6": "red" },
    { "6": "blue" }, { "6": "blue" },
    { "6": "green" }, { "6": "green" },
    { "6": "yellow" }, { "6": "yellow" },
  
    { "7": "red" }, { "7": "red" },
    { "7": "blue" }, { "7": "blue" },
    { "7": "green" }, { "7": "green" },
    { "7": "yellow" }, { "7": "yellow" },
  
    { "8": "red" }, { "8": "red" },
    { "8": "blue" }, { "8": "blue" },
    { "8": "green" }, { "8": "green" },
    { "8": "yellow" }, { "8": "yellow" },
  
    { "9": "red" }, { "9": "red" },
    { "9": "blue" }, { "9": "blue" },
    { "9": "green" }, { "9": "green" },
    { "9": "yellow" }, { "9": "yellow" },
  
    // Action cards
    { "skip": "red" }, { "skip": "red" },
    { "skip": "blue" }, { "skip": "blue" },
    { "skip": "green" }, { "skip": "green" },
    { "skip": "yellow" }, { "skip": "yellow" },
  
    { "reverse": "red" }, { "reverse": "red" },
    { "reverse": "blue" }, { "reverse": "blue" },
    { "reverse": "green" }, { "reverse": "green" },
    { "reverse": "yellow" }, { "reverse": "yellow" },
  
    { "draw2": "red" }, { "draw2": "red" },
    { "draw2": "blue" }, { "draw2": "blue" },
    { "draw2": "green" }, { "draw2": "green" },
    { "draw2": "yellow" }, { "draw2": "yellow" },
  
    // draw 4 cards
    { "draw4": "wild" },
    { "draw4": "wild" },
    { "draw4": "wild" },
    { "draw4": "wild" },
  
    // Wild (normal)
    { "wild": "wild" },
    { "wild": "wild" },
    { "wild": "wild" },
    { "wild": "wild" }
  ];

let users_in_room = {};
let max_cards =  {};
let playing_top = {};
let reserve_top = {};
let turn_wheel = {};
let playing_stack_in_room = {};
let reserve_stack_in_room = {};
const MAX_USERS_PER_ROOM = 4;


function distribute_cards(room_key , max_cards){
    Object.keys(users_in_room[room_key]).forEach(user => {
        for(let i = 0 ; i<max_cards ; i++){
            let index = Math.floor(Math.random()*(reserve_stack_in_room[room_key].length));
            let user_cards = users_in_room[room_key][user];
            user_cards.push(reserve_stack_in_room[room_key][index]);
            reserve_stack_in_room[room_key].splice(index , 1);
            (reserve_top[room_key])--;
        }
    });
}


io.on('connection' , (user) => {
    user.on('join_room' , (ROOM_KEY , selected_number , isCreate) => {
        if(!users_in_room[ROOM_KEY]){
            users_in_room[ROOM_KEY] = {};
            playing_stack_in_room[ROOM_KEY] = [];
            playing_top[ROOM_KEY] = -1;
            reserve_stack_in_room[ROOM_KEY] = DECK_OF_CARDS;
            reserve_top[ROOM_KEY] = DECK_OF_CARDS.length - 1;
            turn_wheel[ROOM_KEY] = [];
        }
        if(isCreate){
            max_cards[ROOM_KEY] = selected_number;
        }
        else if(Object.keys(users_in_room[ROOM_KEY]).length > MAX_USERS_PER_ROOM){
            io.to(user.id).emit('denied_connection' , 'Room is full :(');
            return;
        }
        

        user.join(ROOM_KEY);
        users_in_room[ROOM_KEY][user.id] = [];
        turn_wheel[ROOM_KEY].push(user.id);
        user.on('start_cards_distribution' , (ROOM_KEY) => {
            distribute_cards(ROOM_KEY , max_cards[ROOM_KEY])
        })
    })

})



server.listen(3000 , () => {
    console.log('Server started at PORT: 3000 Successfully.');
})