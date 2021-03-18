const express = require('express')
const path = require('path')

const app = express()

const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.use(express.static(path.join(__dirname, 'public/')))

app.set('views', path.join(__dirname, 'public/'))

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs')

app.use(express.urlencoded({extended: true}))


const rooms = {}

app.get('/', (req, res) => {
  res.render('index', {rooms: rooms})
})

app.post('/room', (req, res) => {
  if( rooms[req.body.room] != null){
    return res.redirect('/')
  }
  rooms[req.body.room] = { users: {}, messages: []}
  res.redirect(req.body.room)
  io.emit('room-created', req.body.room)
})

app.get('/:room', (req, res) => {
  if (rooms[req.params.room]== null){
    return res.redirect('/')
  }
  res.render('room',{ roomName: req.params.room})
})

server.listen(3000)

io.on('connection', socket => {
  console.log(`New user connected: ${socket.id}`)
  
  socket.on('new-user', (room, name) => {
    socket.join(room)
    rooms[room].users[socket.id] = name
    socket.to(room).broadcast.emit('user-connected', name)
    socket.emit('previous-messages',rooms[room].messages)
  })

  socket.on('send-chat-message', (room, message) => {
    rooms[room].messages.push({author: rooms[room].users[socket.id], message: message, })
    socket.to(room).broadcast.emit('chat-message', { message: message, author: rooms[room].users[socket.id]})
  })

  socket.on('disconnect', ()=>{
    getUserRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
  })
})

function getUserRooms(socket){
  return Object.entries(rooms).reduce((names, [name, room])=> {
    if (room.users[socket.id] != null) names.push(name)
    return names
  },[])
}