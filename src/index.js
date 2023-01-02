const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, getUser, removeUser, getUsersInRoom } = require('./utils/users')

/*
socket methods

1. socket.emit
2. io.emit
3. socket.broadcast.emit
4. socket.join(name of the room)
5.io.to.emit emits values to a particular room
6.socket.broadcast.to.emit

*/

const app = express()
const server = http.createServer(app)
const io = socketio(server) //socket io expects a call with the raw http server


const port = process.env.port || 3004
const publicDirectoryPath = path.join(__dirname, '../public')


app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    console.log('new web socket connection')


    socket.on('join', ({ username, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, username, room })


        if (error) {
            return callback(error)
        }

        socket.join(user.room) //joins the chat room

        socket.emit('message', generateMessage('Admin', 'Welcome!')) //server sending "welcome to the client"
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', user.username + ' has joined !'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()


    })

    socket.on('sendmessage', (message) => {  //recieves the message and sends it to all the other clients
        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(user.username, message))

    })

    socket.on('sendlocation', (coords, callback) => {
        var url = 'https:://google.com/maps?q=' + coords.latitude + "," + coords.longitude
        io.emit('locationMessage', generateLocationMessage(url))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', user.username + ' has left!'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})



server.listen(port, () => {
    console.log('Server is up on port ' + port)
})




