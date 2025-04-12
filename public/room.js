const user = io()
const create_room = document.getElementById('create_room')
const select_number_of_cards = document.getElementById('NumberOfCards')
const join_with_key = document.getElementById('join_room_with_room_key')
const joinBtn = document.getElementById('join_with_key_btn')
const startBtn = document.getElementById('startBtn');
let ROOM_KEY = null;
let selected_number = 1;
let isCreate = false;


joinBtn.addEventListener('click' , () => {
    if(join_with_key.value !== '' && join_with_key.value.length >= 10){
        join_room(join_with_key.value)
    }
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

function createRoomKey() {
    let chars = 'ABCDEFGHIJKL0123456789MNOPQRST@$&_UVWXYZ';
    let key ='';
    for(let i = 0 ; i<11 ; i++){
        let index = Math.floor(Math.random()*chars.length);
        key += chars[index];
    }
    return key
}

function join_room(room_key){
    if(room_key){
        user.emit('join_room' , room_key , selected_number , isCreate);
    }
}