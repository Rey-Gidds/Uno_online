const express = require('express');
const path = require('path')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { start } = require('repl');

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

let users_in_room = {}; // stores the user ids as the value with corresponding array of cards that the user is holding and room key as the main key inside which contains the following structure:
/** room_key: {
*    user1 : [cards],
*    user2 : [cards]  
*   }
*  ,
*   room_key2: {
*    user1: [cards],
*    user2: [cards],
*   }
 */
let player_indexes = {}; // storing the player indexes as key value pair : user.id : index , Eg: player 1 , player 2 , ... for a given unique user to reflect the uno and uno free events to everyone in the room on the front end.
let max_cards =  {};
let turn_wheel = {};
/** Contains the following structre
 * room_key : [user1 , user2 , ... , turn_pointer_index],
 * room_key2 : [user1 , user2 , ... , turn_pointer_index]
 */
let playing_stack_in_room = {};
let reserve_stack_in_room = {};
const MAX_USERS_PER_ROOM = 4;

// Reverses the array of turn_wheel while keeping the turn_pointer at the last using two pointer.
function reverse(room_key){
    let L = 0;
    let R = turn_wheel[room_key].length - 2; // because the last element contains the turn pointer and it should be there at the last only.
    while(L < R){
        let temp = turn_wheel[room_key][L];
        turn_wheel[room_key][L] = turn_wheel[room_key][R];
        turn_wheel[room_key][R] = temp;
        L++;
        R--;
    }
}

// specifically serves the picked_card to the user on the frontend and updates it at the backend.
function picked_card(room_key , user){
    let index = Math.floor(Math.random()*(reserve_stack_in_room[room_key].length));
    let random_card = reserve_stack_in_room[room_key][index];
    users_in_room[room_key][user].push(reserve_stack_in_room[room_key][index]);
    reserve_stack_in_room[room_key].splice(index , 1);
    io.to(user).emit('take_picked_card' , random_card);
}

// Helper function that draws cards updates it at the backend and sends the array of drawn cards to the frontend
function draw_cards(room_key , user , max_cards){
    let cards = [];
    for(let i = 0 ; i<max_cards ; i++){
        let index = Math.floor(Math.random()*(reserve_stack_in_room[room_key].length));
        cards.push(reserve_stack_in_room[room_key][index]);
        users_in_room[room_key][user].push(reserve_stack_in_room[room_key][index]);
        reserve_stack_in_room[room_key].splice(index , 1);
    }
    io.to(user).emit('take_cards' , cards);
}

// Updates the playing stack at the frontend and the backend , playing stack is the stack where the cards are being played by every user.
function update_playing_stack(room_key, number, color) {
    let card = {};
    card[number] = color;
    playing_stack_in_room[room_key].push(card);
    io.to(room_key).emit('update_playing_stack'  , number , color);
}

// Helper function to validate the move played and to punish the user for a wrong move with 2 cards.
function play_turn(number , color , room_key, userId , index){
    if(validate_move(number , color , room_key , userId)){
        console.log(turn_wheel[room_key]);
        users_in_room[room_key][userId].splice(index , 1); // remove the card played from the user bundle
        if(isUNO(users_in_room[room_key][userId])){
            io.to(room_key).emit('uno_event' , player_indexes[userId]);
        }
        if(isUNOfree(users_in_room[room_key][userId])){
            let free_user_index = player_indexes[userId] - 1;
            let player_index = free_user_index + 1;
            io.to(room_key).emit('uno_free_event' , player_index);
            io.to(userId).emit('display_uno_free');
            turn_wheel[room_key].splice(free_user_index , 1); // removing the user from the turn wheel since he/she is uno free.
        }
        io.to(userId).emit('update_the_bundle' , users_in_room[room_key][userId]); // update the bundle on the frontend simultaneously
        update_playing_stack(room_key , number , color);
        // update_turn(room_key , turn_wheel[room_key].length - 1);
        console.log('User Bundle: ',users_in_room[room_key][userId]) // roomkey and maximum number of players in the room.
    }else{
        update_turn(room_key , turn_wheel[room_key].length - 1); // also update when the user makes a wrong move.
        draw_cards(room_key , userId , 2); // draw 5 cards on wrong move.
    }
}

// Helper function to check the uno event
function isUNO(user_bundle){
    if(user_bundle.length == 1){
        return true;
    }
    return false;
}

// Helper function to check the uno free event
function isUNOfree(user_bundle){
    if(user_bundle.length == 0){
        return true
    }
    return false
}

// Places the initial card to the playing stack of the corressponding room.
function place_initial_card(room_key){
    let length = reserve_stack_in_room[room_key].length;
    let index = Math.floor(Math.random()*length);
    let card = reserve_stack_in_room[room_key][index];
    while(Object.values(card) == 'wild' || Object.keys(card) == 'skip' || Object.keys(card) == 'reverse' || Object.keys(card) == 'draw2'){
        index = Math.floor(Math.random()*length);
        card = reserve_stack_in_room[room_key][index];
    }
    reserve_stack_in_room[room_key].splice(index , 1);
    playing_stack_in_room[room_key].push(card);
    io.to(room_key).emit('Place_initial_card' , card);
}

// Helper function to validate the turn if the user plays a move without it's turn.
function validate_turn(userId , room_key){
    let current_move_userId = turn_wheel[room_key][turn_wheel[room_key].at(-1)];
    if(userId == current_move_userId){
        return true;
    }
    return false;
}

// Validates the card being played by the user with the top card of the playing stack.
function validate_move(number , color , room_key , userId){
    let top_card = playing_stack_in_room[room_key].pop();
    if(number == 'draw4'){
        io.to(userId).emit('choose_wild_color');
        update_turn(room_key , turn_wheel[room_key].length - 1);
        let card_bearer = turn_wheel[room_key][turn_wheel[room_key].at(-1)];
        draw_cards(room_key , card_bearer , 4);
        update_turn(room_key , turn_wheel[room_key].length - 1); // To skip the card bearer turn.
        return true;
    }
    else if(number == 'wild' && color == 'wild'){
        io.to(userId).emit('choose_wild_color');
        update_turn(room_key , turn_wheel[room_key].length - 1);
        io.to(turn_wheel[room_key][turn_wheel[room_key].at(-1)]).emit('wait_for_wild_color');
        return true;
    }
    else if(number == 'reverse' && (Object.values(top_card) == color || Object.keys(top_card) == 'reverse')){
        reverse(room_key);
        update_turn(room_key , turn_wheel[room_key].length - 1);
        return true;
    }
    else if(number == 'skip' && (Object.values(top_card) == color || Object.keys(top_card) == 'skip')){
        update_turn(room_key , turn_wheel[room_key].length - 1);
        update_turn(room_key , turn_wheel[room_key].length - 1); // updating the turn here and after it returns true , turn will be updated in the play_turn() also which will skip the turn of the player.
        return true;
    }
    else if(number == 'draw2' && (Object.values(top_card) == color || Object.keys(top_card) == 'draw2')){
        update_turn(room_key , turn_wheel[room_key].length - 1);
        let card_bearer = turn_wheel[room_key][turn_wheel[room_key].at(-1)];
        draw_cards(room_key , card_bearer , 2);
        update_turn(room_key , turn_wheel[room_key].length - 1); // To skip the turn of the card bearer
        return true;
    }
    else if(Object.keys(top_card) == number || Object.values(top_card) == color){
        update_turn(room_key , turn_wheel[room_key].length - 1); // To skip the turn of the card bearer
        return true;
    }
    playing_stack_in_room[room_key].push(top_card); // if not valid move push back the card to the playing stack.
    return false;
}   

// Helper function to update the turn_wheel
function update_turn(room_key , max_members){
    const MAX = max_members;
    let turn_pointer = turn_wheel[room_key].at(-1);
    io.to(turn_wheel[room_key][turn_pointer]).emit('pass_the_turn');
    let new_pointer = (turn_pointer + 1)%MAX;
    turn_wheel[room_key][turn_wheel[room_key].length - 1] = new_pointer;
    io.to(turn_wheel[room_key][turn_wheel[room_key].at(-1)]).emit('your_turn' , 'it is your turn'); // tell the next person that it is his/her turn.
    return;
}

// Helper function to assign the player indexes to every user joined in the respective room. Eg: player 1 , player 2 , ... for a specific room.
function playerIndex(userId , room_key){
    for(let i = 0 ; i < turn_wheel[room_key].length; i++){
        if(userId === turn_wheel[room_key][i]){
            return i + 1;
        }
    }
    return null;
}

function shiftIndexes(roomkey , startfrom){
    for(let i = startfrom - 1 ; i<turn_wheel[roomkey].length ; i++){
        turn_wheel[roomkey][i] -= 1;
    }
    return;
}


// Socket handling 
io.on('connection' , (user) => {
    user.on('join_room' , (ROOM_KEY , selected_number , isCreate) => {
        if(!users_in_room[ROOM_KEY]){
            users_in_room[ROOM_KEY] = {};
            users_in_room[ROOM_KEY]['started'] = false;
            playing_stack_in_room[ROOM_KEY] = [];
            reserve_stack_in_room[ROOM_KEY] = [...DECK_OF_CARDS]; // Shallow copy of ddeck of cards to maintain for each room.
            turn_wheel[ROOM_KEY] = [];
        }
        else if(users_in_room[ROOM_KEY]['started']){ // denying connection to the room if the game has already been started.
            io.to(user.id).emit('denied_connection' , 'Cannot join , game has already been started :(');
            return;
        }
        else if(Object.keys(users_in_room[ROOM_KEY]).length > MAX_USERS_PER_ROOM){
            io.to(user.id).emit('denied_connection' , 'Room is full :(');
            return;
        }
        if(isCreate){
            max_cards[ROOM_KEY] = selected_number;
        }
        
        user.join(ROOM_KEY);

        io.to(user.id).emit('take_user_id' , user.id); // Take the user id generated at the frontend for further verification of who made the move.
        
        users_in_room[ROOM_KEY][user.id] = [];
        turn_wheel[ROOM_KEY].push(user.id);
        p_index = playerIndex(user.id , ROOM_KEY);
        
        player_indexes[user.id] = p_index;
        console.log(`${user.id} : ${player_indexes[user.id]}`);
        io.to(ROOM_KEY).emit('update_active_users' , turn_wheel[ROOM_KEY]);
    
        user.on('start_cards_distribution' , (room_key) => {
            if(turn_wheel[room_key].length > 1){
                users_in_room[room_key]['started'] = true;
                turn_wheel[ROOM_KEY].push(0); // Pointer to the first turn as index 0 stored at the last index of the turn wheel
                Object.keys(users_in_room[room_key]).forEach(user => {
                    draw_cards(room_key ,user, max_cards[room_key]) // Give cards to the room initially.
                })
                place_initial_card(room_key); // Places the initial card to the playing_stack and updates the frontend for the given room key.
                io.to(turn_wheel[room_key][0]).emit('your_turn' , 'it is your turn');
            }
            else{
                io.to(user.id).emit('not_enough_players' , 'Really ? are you gonna play alone ?'); // Don't start the game alone , atleast 2 people are required.
            }
        })

        user.on('validate_move' , (number , color , room_key , userId , index) => {
            if(validate_turn(userId , room_key)){
                play_turn(number , color , room_key , userId , index); // play_turn , if the user who played has it's current turn , else punish the user with 5 cards.
            }else{
                draw_cards(room_key , userId , 2); // 5 Cards shall be drawn on playing a wrong move.
            }
        })

        user.on('pick_card' , (userId , room_key) => {
            let current_move_userId = turn_wheel[room_key][turn_wheel[room_key].at(-1)];
            if(current_move_userId != userId){
                io.to(userId).emit('Wait_for_your_turn' , 'Wait for your turn');
                return;
            }
            else{
                picked_card(room_key , userId);
                return;
            }
        })

        user.on('take_wild_color' , (color , room_key) => {
            update_playing_stack(room_key , 'wild' , color);
            io.to(turn_wheel[room_key][turn_wheel[room_key].at(-1)]).emit('wild_color_placed' , 'It is your turn');
        })

        user.on('pass_turn' , (room_key) => {
            update_turn(room_key , turn_wheel[room_key].length - 1); // give the user one card picked by his or her own choice
        })

        user.on('disconnect' , () => {
            (users_in_room[ROOM_KEY][user.id]).forEach(card => reserve_stack_in_room[ROOM_KEY].push(card)); // To hand back the cards held by the user to the reserve stack in the room.
            let disconnected_index = player_indexes[ROOM_KEY][user.id];
            shiftIndexes(ROOM_KEY , disconnected_index);
            io.to(ROOM_KEY).emit('remove_user_ball' , user.id);
            delete users_in_room[ROOM_KEY][user.id];
            delete player_indexes[ROOM_KEY];
            (turn_wheel[ROOM_KEY]).filter(user => user != user.id);
            console.log('Turn Wheel: ' , turn_wheel[ROOM_KEY]);
            if(Object.keys(users_in_room[ROOM_KEY]).length == 0){
                delete users_in_room[ROOM_KEY];
                delete turn_wheel[ROOM_KEY];
                delete reserve_stack_in_room[ROOM_KEY];
                delete playing_stack_in_room[ROOM_KEY];
            }
        })
    })

})

const PORT = process.env.PORT || 3000;
server.listen(PORT , () => {
    console.log('Server started at PORT: 3000 Successfully.');
})