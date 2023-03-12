const app = require('express')()
const { createServer } = require('http')
const { Server } = require('socket.io')
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'https://tiktok-lekhanh.web.app',
            'https://tiktok-socket.onrender.com',
        ],
    },
})

app.use(function (req, res, next) {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3004',
        'http://localhost:8900',
        'https://tiktok-lekhanh.web.app',
        'https://tiktok-socket.onrender.com',
        'https://tiktok-server.vercel.app',
    ]

    const origin = req.headers.origin
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
    }
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    )
    res.header('Access-Control-Allow-credentials', true)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, UPDATE')
    next()
})
app.get('/', function (req, res, next) {
    res.json('SocketIO Server!')
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

server.listen(IO_PORT, () => {
    console.log(`Socket.IO server running at http://localhost:${IO_PORT}`)
})
