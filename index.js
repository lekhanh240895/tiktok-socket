const app = require('express')()
const { createServer } = require('http')
const { Server } = require('socket.io')
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:3000',
            'https://tiktok-lekhanh.vercel.app',
            'https://tiktok-socket.onrender.com',
        ],
    },
})

app.get('/', function (req, res, next) {
    res.json('SocketIO server!')
})

require('dotenv').config()

const IO_PORT = process.env.SOCKETIO_PORT || 3000

let onlineUsers = []

const addUser = (userID, socketID) => {
    !onlineUsers.some((user) => user.userID === userID) &&
        onlineUsers.push({ userID, socketID })
}

const removeUser = (socketID) => {
    onlineUsers = onlineUsers.filter((user) => user.socketID !== socketID)
}

const getUser = (userID) => {
    return onlineUsers.find((user) => user.userID === userID)
}

io.on('connection', (socket) => {
    // When connected
    console.log('a user connected')
    // Take userID & socketID
    socket.on('addUser', (userID) => {
        addUser(userID, socket.id)
        io.emit('getUsers', onlineUsers)
    })

    // When disconnected
    socket.on('disconnect', () => {
        console.log('a user disconnected')
        removeUser(socket.id)
        io.emit('getUsers', onlineUsers)
    })

    // Send and get message
    socket.on('sendMessage', ({ receiver, ...other }) => {
        const user = getUser(receiver)
        if (user) {
            io.to(user.socketID).emit('getMessage', other)
        }
    })

    // Send and get notifications
    socket.on('sendNotification', (data) => {
        const user = getUser(data.receiver)
        const isNotOwn = data.receiver !== data.sender._id

        if (user && isNotOwn) {
            io.to(user.socketID).emit('getNotification', data)
        }
    })
})

httpServer.listen(IO_PORT, () => {
    console.log(`Socket.IO server running at http://localhost:${IO_PORT}`)
})
