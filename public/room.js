const user = io()
const create_room = document.getElementById('create_room')
const select_number_of_cards = document.getElementById('NumberOfCards')
const join_with_key = document.getElementById('join_room_with_room_key')
const display_roomkey = document.getElementById('display_roomKey')
const joinBtn = document.getElementById('join_with_key_btn')
const users_joined = document.getElementById('users_joined')
const display_bundle = document.getElementById('my_bundle')
const playing_stack = document.getElementById('playing_stack')
const startBtn = document.getElementById('startbtn')
const your_turn = document.getElementById('your_turn')
const not_your_turn = document.getElementById('not_your_turn')
const pickBtn = document.getElementById('reserve_stack')
const passBtn = document.getElementById('passBtn')
let ROOM_KEY = null;
let selected_number = 1;
let user_id = '';
let myBundle = [];
let isCreate = false;
let myturn = false;
let picked = false;
let index = 0;
let p_index = null;
let joined = false;
not_your_turn.style.display = 'none';
your_turn.style.display = 'none';

function createRoomKey() {
    if(joined){
        alert('You are already joined in a room.');
        return;
    }
    let chars = 'ABCDEFGHIJKL0123456789MNOPQRST@$&_UVWXYZ';
    let key ='';
    for(let i = 0 ; i<11 ; i++){
        let index = Math.floor(Math.random()*chars.length);
        key += chars[index];
    }
    join_with_key.value = key;
    return key;
}

function join_room(room_key){
    if(room_key){
        user.emit('join_room' , room_key , selected_number , isCreate);
        display_roomkey.innerHTML = `Room key: ${room_key}`;
    }
}

function generateCardElement(number , color , display_area , class_name){
    let card = document.createElement('button');
    card.className = class_name;
    card.setAttribute('data-number' , number);
    card.setAttribute('data-color' , color);
    card.innerHTML = `<p><b> ${number} </b></p>`;
    if(color == 'wild'){
        card.style.backgroundColor = 'black';
    }
    else{
        card.style.backgroundColor = color;
    }
    if(display_area == display_bundle){
        card.id = index;
        card.setAttribute('data-index' , index);
        index++;
    }
    else{
        display_area.innerHTML = '';
    }
    display_area.appendChild(card);
}

function paintUserBallAndDisplay(users){
    users_joined.innerHTML = '';
    Object.keys(users).forEach(user => {
        let user_ball = document.createElement('div');
        user_ball.id = `${user}`;
        user_ball.className = 'user_ball';
        user_ball.style.backgroundColor = 'white';
        users_joined.appendChild(user_ball);
    });
}

function remove_played_card(number , color){
    for(let i = 0; i<myBundle.length ; i++){
        if(Object.keys(myBundle[i])[0] == number && Object.values(myBundle[i])[0] == color){
            let index = i;
            myBundle.splice(index , 1);
            return;
        }
    }
}

function play_card(number , color , userId , index){
    console.log('Playing Card...');
    remove_played_card(number , color);
    user.emit('validate_move' , number , color , ROOM_KEY , userId , index);
    myturn = false;
    picked = false;
}

pickBtn.addEventListener('click' , () => {
    if(picked){
        alert("Please play the move or pass the turn as you've already picked a card");
        return;
    }
    else if(!myturn){
        return;
    }
    user.emit('pick_card' , user_id , ROOM_KEY);
    picked = true;
})

joinBtn.addEventListener('click' , () => {
    if(join_with_key.value !== '' && join_with_key.value.length >= 10){
        ROOM_KEY = join_with_key.value;
        join_room(join_with_key.value)
    }
})

display_bundle.addEventListener('click', (e) => {
    const card = e.target.closest('.cards');
    if (card) {
        let number = card.getAttribute('data-number');
        let color = card.getAttribute('data-color');
        let index = card.getAttribute('data-index');
        play_card(number, color , user_id , index);
        console.log(myBundle);
    }
    your_turn.style.display = 'none';
    not_your_turn.style.display = 'block';
    not_your_turn.innerHTML = '⚠️ Please wait for your turn.';
});


passBtn.addEventListener('click' , () => {
    if(!myturn){
        alert('Please wait for your turn.')
        return;
    }
    else if(!picked){
        alert('Please pick a card before passing the turn.');
        return;
    }
    your_turn.style.display = 'none';
    not_your_turn.style.display = 'block';
    not_your_turn.innerHTML = '⚠️ Please wait for your turn.';
    user.emit('pass_turn' , ROOM_KEY);
    picked = false;
})

startBtn.addEventListener('click' , () => {
    if(ROOM_KEY){
        user.emit('start_cards_distribution' , ROOM_KEY);
    }
})

create_room.addEventListener('click' , () => {
    ROOM_KEY = createRoomKey();
    isCreate = true
    join_room(ROOM_KEY)
})

select_number_of_cards.addEventListener('change' , (event) => {
    selected_number = event.target.value;
    console.log(selected_number)
})

user.on('update_playing_stack' , (number , color) => {
    generateCardElement(number , color , playing_stack , 'playing_stack_card');
})

user.on('take_user_id' , (userId) => {
    user_id = userId;
    joined = true;
    console.log('Taken_user_id' , user_id);
})

user.on('Wait_for_your_turn' , (msg) => {
    alert(msg); // wait for the turn to be able to pick the card.
})

user.on('take_player_index' , (player_index) => {
    if(!p_index){
        p_index = player_index;
    }
    return;
})

user.on('uno_event' , (player_index) => {
    console.log('Player index: ' , player_index);
    if(player_index){
        alert(`${player_index}: UNO !`);
    }
})

user.on('uno_free_event' , (player_index) => {
    console.log('Player index: ' , player_index);
    if(player_index){
        alert(`${player_index}: UNO FREE !`);
    }
})

user.on('choose_wild_color' , () => {
    let color = parseInt(prompt(`
        Choose the Color:
        1) Yellow
        2) Red
        3) Green
        4) Blue
    `));

    while(color < 1 && color > 4){
        color = parseInt(prompt(`
            Choose the Color:
            1) Yellow
            2) Red
            3) Green
            4) Blue
        `));
    }
    
    switch(color){
        case 1:
            color = 'yellow';
            break;
        case 2:
            color = 'red';
            break;
        case 3:
            color = 'green';
            break;
        case 4:
            color = 'blue';
            break;
    }
    user.emit('take_wild_color' , color , ROOM_KEY);
})

user.on('take_cards' , (cards) => {
    myturn = false;
    cards.forEach(card => {
        myBundle.push(card);
        generateCardElement(Object.keys(card) , Object.values(card) , display_bundle , 'cards');
    });
})

function updateMyStack(){
    display_bundle.innerHTML = '';
    index = 0;
    myBundle.forEach(card => {
        generateCardElement(Object.keys(card) , Object.values(card) , display_bundle , 'cards');
    })
}

user.on('update_the_bundle' , (bundle) => {
    myBundle = bundle;
    console.log('My Bundle: ' , myBundle);
    updateMyStack();
    return;
})

user.on('take_picked_card' , (picked_card) => {
    myBundle.push(picked_card);
    generateCardElement(Object.keys(picked_card) , Object.values(picked_card) , display_bundle , 'cards');
})

user.on('update_active_users' , (users) => {
    console.log('Active Users: ' ,users);
    paintUserBallAndDisplay(users);
})

user.on('Place_initial_card' , (card) => {
    generateCardElement(Object.keys(card) , Object.values(card) , playing_stack , 'playing_stack_card');
})

user.on('your_turn' , (msg) => {
    myturn = true;
    not_your_turn.innerHTML = '';
    not_your_turn.style.display = 'none';
    your_turn.style.display = 'block';
    your_turn.innerHTML = `<p> ${msg} </p>`;
    console.log(msg);
})

user.on('wait_for_wild_color' , () => {
    myturn = false; // at the backend it is the user's turn but to make the user wait for the wild card temporarily making the myturn false at the front end so that the user cant play a chance before the wild card has been placed.
    your_turn.style.display = 'none';
    not_your_turn.style.display = 'block';
    not_your_turn.innerHTML = '⚠️ Please wait for wild card.';
})

user.on('wild_color_placed' , (msg) => {
    myturn = true;
    not_your_turn.innerHTML = '';
    not_your_turn.style.display = 'none';
    your_turn.style.display = 'block';
    your_turn.innerHTML = `<p> ${msg} </p>`;
})

user.on('pass_the_turn' , () =>{
    myturn = false;
    your_turn.style.display = 'none';
    not_your_turn.style.display = 'block';
    not_your_turn.innerHTML = '⚠️ Please wait for your turn.';
})

user.on('not_enough_players' , (msg) => {
    alert(msg);
})