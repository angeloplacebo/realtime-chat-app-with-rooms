const socket = io("http://localhost:3000");
const roomsList = document.getElementById("rooms-list");

var messageContainer;
var messageForm;
var messageInput;

const Storage = {
  PREFIX: "chat-app",
  getName() {
    return localStorage.getItem(`${this.PREFIX}-client-name`);
  },
  setName(name) {
    localStorage.setItem(`${this.PREFIX}-client-name`, name);
  },
  getRoomName() {
    return localStorage.getItem(`${this.PREFIX}-client-roomName`);
  },
  setRoomName(name) {
    localStorage.setItem(`${this.PREFIX}-client-roomName`, name);
  },
  updateLocalVariables(){
    roomName = this.getRoomName();
    username = this.getName();
  }
};

const Login = {
  form: document.querySelector("form"),
  username: document.querySelector("input[name=name]"),
  Submit() {
    Storage.setName(this.username.value);
    this.form.submit();
  },
};

const Rooms = {
  form: document.getElementById("room"),
  roomName: document.querySelector('input[name="room"]'),
  create(e) {
    e.preventDefault();
    this.send();
  },
  send() {
    var request = new XMLHttpRequest();
    request.open("POST", "/room", true);
    request.setRequestHeader(
      "Content-Type",
      "application/x-www-form-urlencoded"
    );
    var params = `room=${this.roomName.value}`;
    request.send(params);
  },
};

let username = Storage.getName();
let roomName = Storage.getRoomName();

const Conversation = {
  container: document.getElementById("conversation"),

  open(roomName) {
    Storage.setRoomName(roomName);
    Storage.updateLocalVariables();
    
    const html = `
      <div id="message-container"></div>
        <form id="send-container">
          <input type="text" id="message-input" autocomplete="off" placeholder="Type your message here">
          <button type="submit">
            <img src="/icons/send.svg" alt="">
          </button>
        </form>
      </div>`;

    this.container.innerHTML = html;

    this.updateElementsVariables();

    this.addFormListener();

    this.enterRoom();
  },

  addFormListener() {
    messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = messageInput.value;
      if (message) {
        socket.emit("send-chat-message", roomName, message);
        appendSendedMessage(message);
        messageInput.value = "";
      }
    });
  },

  enterRoom() {
    userFunctions.checkUsername();

    socket.emit("new-user", roomName, username);
  },

  updateElementsVariables() {
    messageContainer = document.getElementById("message-container");
    messageForm = document.getElementById("send-container");
    messageInput = document.getElementById("message-input");
  },
};

const userFunctions = {
  updateUsername(name) {
    Storage.setName(name != null ? name : "Anônimo");
    username = Storage.getName();
  },

  askUsername() {
    const name = prompt("What is your name?");
    this.updateUsername(name);
  },

  checkUsername() {
    if (!username) {
      this.askUsername();
    }
  },
};

if (roomsList != null) {
  socket.on("room-created", (room) => {
    const roomElement = document.createElement("li");
    roomElement.id = room;

    const roomName = document.createElement("span");
    roomName.innerText = room;

    const roomLink = document.createElement("a");
    roomLink.href = "#";
    roomLink.innerText = "Join";
    roomLink.setAttribute("onclick", `Conversation.open("${room}")`);

    roomElement.append(roomName);
    roomElement.append(roomLink);
    roomsList.append(roomElement);
    roomsList.scrollTop = roomsList.scrollHeight;

  });

  socket.on("room-deleted", (room) => {
    const roomElement = document.getElementById(room);
    roomElement.remove();
  });
}

socket.on("previous-messages", (messages) => {
  for (message of messages) {
    appendMessage(message);
  }
  appendNotes("You Joined");
});

socket.on("chat-message", (data) => {
  appendMessage(data);
});

socket.on("user-connected", (name) => {
  appendNotes(`${name} connected`);
});

socket.on("user-disconnected", (name) => {
  appendNotes(`${name} disconnected`);
});

socket.on("alert", (message) => {
  appendNotes(message);
});

function appendNotes(note) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("received", "note");
  messageElement.innerText = note;
  messageContainer.append(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function appendMessage(data) {
  let { author, message } = data;
  const messageElement = document.createElement("div");
  messageElement.classList.add("received");
  messageElement.innerHTML = `<strong>${author}:</strong> ${message}`;
  messageContainer.append(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function appendSendedMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("sended");
  messageElement.innerText = message;
  messageContainer.append(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}
