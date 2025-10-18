let blockedUsers = [];

document.addEventListener("DOMContentLoaded", () => {
  window.chatSocket = null; // WebSocket bağlantısı
  let currentChatId = "general"; // Hangi sohbetin aktif olduğunu takip etmek için

  function selectItem2(chatItem) {
    const allChatItems = document.querySelectorAll(".chat-changing");
    allChatItems.forEach((item) => {
      item.classList.remove("inactive");
    });
    chatItem.classList.add("inactive");
  }

  /* CHAT DROPDOWN */

  const dropdownTrigger = document.querySelector(".match-general-chat-btn");
  const dropdownMenu = document.querySelector(".match-dropdown-menu");

  dropdownTrigger.addEventListener("click", function () {
    // Dropdown menüsünü açıp kapama işlemi
    dropdownMenu.style.left = `${-17.5}vw`;
    dropdownMenu.style.transform = "translate(0px, 0px)";
    dropdownMenu.classList.toggle("show");
  });

  loadChatRoom({ username: "general", room_id: "general" }, true);

  fetch("https://10.11.4.10/api/friends", {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      const user_data = data; // Backend'den gelen kullanıcı verileri
      const chatList = document.getElementById("chat-list"); // Dropdown'daki chat listesi

      const generalChatItem = document.createElement("li");
      generalChatItem.className =
        "match-dropdown-item d-flex align-items-center chat-changing";
      generalChatItem.style = "justify-content: flex-start;";
      generalChatItem.onclick = () =>
        loadChatRoom({ username: "general", room_id: "general" }, true);
      selectItem2(generalChatItem);
      generalChatItem.innerHTML = `
                  <img src="/img/world.png" class="chat-img shadow me-2" alt="General Chat">
                  <a data-lang="general-chat-pop">General Chat</a>
                  `;
      chatList.appendChild(generalChatItem);

      user_data.forEach((user) => {
        const chatItem = document.createElement("li");
        chatItem.className =
          "match-dropdown-item d-flex align-items-center chat-changing";
        chatItem.onclick = () => {
          loadChatRoom(user);
          selectItem2(chatItem);
        };
        const profileImage =
          user.profile_picture !== "null"
            ? user.profile_picture
            : "/img/defaultpp.jpg";

        chatItem.innerHTML = `
            <div class="chat-friend-container">
              <img src="${profileImage}" class="chat-img shadow me-2" alt="Profile Image">
              <a>${user.username}</a>
              <button class="cool-btn invate-btn"">Davet Et</button>
              <button class="cool-btn block-btn" onclick=blockUser('${user.username}')>X</button>
            </div>
          `;
        const inviteButton = chatItem.querySelector("button");
        inviteButton.addEventListener("click", (event) => {
          pathname = window.location.pathname;
          if (pathname.substring(0, 5) === "/game") {
            if (currentChatId === "general") {
              alert("You can't invite someone to general chat!");
              return;
            }
            chatSocket.send(
              JSON.stringify({
                username: user_profile.username,
                message: `Seni oyun oynamaya davet ediyorum! <button class="cool-btn accept-btn" data-url-path="/join-room-${pathname.substring(
                  6,
                  12
                )}">Kabul Et</button>`,
              })
            );
          }
        });
        chatList.appendChild(chatItem);
      });
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });

  async function loadChatRoom(friend, isGeneral = false) {
    await fetch("https://10.11.4.10/api/get-blocked-users/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${auth_token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        blockedUsers = data.blocked_users;
      });
    const friendUsername = friend.username;

    if (blockedUsers.some((user) => user.username === friendUsername)) {
      if (confirm("This user is blocked. Do you want to unblock this user?")) {
        unblockUser(friendUsername);
      }
      return;
    }
    const chatRoomName = isGeneral
      ? "general"
      : `room_${[user_profile.username, friendUsername].sort().join("_")}`;

    if (chatSocket) {
      chatSocket.close();
    }

    // WebSocket bağlantısını başlat
    chatSocket = new WebSocket(
      "wss://" + "10.11.4.10" + "/ws/chat/" + chatRoomName + "/"
    );
    chatSocket.onopen = function () {
      currentChatId = chatRoomName;
      document.getElementById("chat-log").innerHTML = "";

      if (isGeneral) {
        document.getElementsByClassName("dropdown-chat-name")[0].innerText =
          "General Chat";
        document.getElementsByClassName("chat-img-general")[0].src =
          "/img/world.png";
      } else {
        document.getElementsByClassName("dropdown-chat-name")[0].innerText =
          friend.username;

        const profileImage =
          friend.profile_picture !== "null"
            ? friend.profile_picture
            : "/img/defaultpp.jpg";
        document.getElementsByClassName("chat-img-general")[0].src =
          profileImage;
      }
    };

    chatSocket.onclose = function () {
    };

    chatSocket.onmessage = function (e) {
      const data = JSON.parse(e.data);
      const message = data["message"];
      const username = data["username"];
      const messageElement = document.createElement("div");
      messageElement.innerHTML = `<span data-url-path="/user-${username}"><strong>${username}</strong></span>: ${message}`;
      document.getElementById("chat-log").appendChild(messageElement);
    };

    const sendButton = document.getElementById("send-button");
    sendButton.onclick = function () {
      const messageInput = document.getElementById("message-input");
      const message = messageInput.value;

      if (chatSocket) {
        chatSocket.send(
          JSON.stringify({
            username: user_profile.username,
            message: message,
          })
        );
        messageInput.value = "";
      }
    };

    currentChatId = chatRoomName;
  }
});

function blockUser(username) {
  if (blockedUsers.some((user) => user.username === friendUsername)) {
    alert("This user is blocked. You cannot open a chat room.");
    return;
  }

  fetch("https://10.11.4.10/api/block-user/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${auth_token}`,
    },
    body: JSON.stringify({
      username: username,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      window.location.reload();
      alert(data.message);
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred while blocking the user.");
    });
}

function unblockUser(username) {
  fetch("https://10.11.4.10/api/unblock-user/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${auth_token}`,
    },
    body: JSON.stringify({
      username: username,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      alert(data.message);
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred while unblocking the user.");
    });
}
