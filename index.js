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

server.listen(3000 , () => {
    console.log('Server started at PORT: 3000 Successfully.');
})