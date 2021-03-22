const socket = io("http://localhost:3000");
const messageContainer = document.getElementById("message-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");

let username

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
};

const Conversation = {
  addListener(){
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

  enterRoom(){
    socket.emit("new-user", roomName, username);
  }
};


Storage.setRoomName(roomName)
Storage.setName('')

userFunctions.askUsername();

username = Storage.getName();

Conversation.addListener();
Conversation.enterRoom();

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
