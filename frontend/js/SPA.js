user_profile = {};
active_users = [];
token = localStorage.getItem("token");
roomID = null;
document.addEventListener("DOMContentLoaded", () => {

  const indicator = document.querySelector(".nav-indicator");
  const contentElement = document.getElementById("content");

  function handleIndicator(el) {
    if (el.classList.contains("nav-item")) {
      const items = document.querySelectorAll(".nav-item"); // Yeni nav-item'ları da dahil et
      items.forEach((item) => {
        item.classList.remove("is-active");
        item.style.color = ""; // Renk sıfırlama
      });

      indicator.style.width = `${el.offsetWidth}px`;
      indicator.style.left = `${el.offsetLeft}px`;
      indicator.style.backgroundColor = el.getAttribute("active-color");

      el.classList.add("is-active");
      el.style.color = el.getAttribute("active-color");
    }
  }
  document.getElementById("findFriendSearch").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        const inputValue = this.value.trim();
        if (inputValue) {
            const newPath = `/user-${inputValue}`;
            loadPageBasedOnPath(newPath);
        }
    }
  });
  async function loadPageBasedOnPath(pathname) {
    pathname = rtrim(pathname, "/");
    var pathname_username = null;
    var finduser = false;
    var pathname_username = null;

    if (pathname.startsWith("/user-") && pathname.length > 6) {
      pathname_username = pathname.substring(6);
      finduser = await findUserAndGetData(pathname_username, token);
      if (finduser) {
        pathname = "/user-";
      } else {
        pathname = "/usernotfound/";
      }
    }
    if (pathname.startsWith("match-history-")) {
      pathname_username = pathname.substring(14);
      pathname = "/matchs-history";
    }
    if (pathname.substring(0, 6) === "/game-") {
      var room_id = pathname.substring(6);
      if (room_id.length != 6) {
        return;
      }
      const matchData = await createRoom(room_id);

      if (matchData.data.status == "Empty" || matchData.data.status == "ended") {
        return;
      }
        fetch("/pages/game-room.html", { cache: "no-cache" })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.text();
          })
          .then((html) => {
            contentElement.classList.remove("fade-in");
            contentElement.style.opacity = 0;
            setTimeout(() => {
              contentElement.innerHTML = html;
              document.title = "Game Room: " + room_id + " - ";
              window.history.pushState(null, "", pathname);
              contentElement.classList.add("fade-in");
              contentElement.style.opacity = 1;
            }, 100);
          })
          .catch((error) =>
            console.error(
              "There has been a problem with your fetch operation:",
              error
            )
          );
      setTimeout(() => {
        
        initialize(room_id);
      }, 100);
      }
    else if (routes[pathname]) {
      if (gameSocket) 
        gameSocket.close();
      fetch(routes[pathname].contentPath, { cache: "no-cache" })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.text();
        })
        .then((html) => {
          contentElement.classList.remove("fade-in");
          contentElement.style.opacity = 0;

          setTimeout(() => {
            contentElement.innerHTML = html;
            document.title = routes[pathname].title;
            if (pathname_username && finduser) {
              window.history.pushState(null, "", pathname + pathname_username);
            } else {
              window.history.pushState(null, "", pathname);
            }

            if (pathname === "/profile") {
              document.getElementById("my-picture").src =
                user_profile.profile_picture;
              document.getElementById("table-username").textContent = user_profile.username;
              document.getElementById("my-email").textContent = user_profile.email;
              document.getElementById("my-firstname").textContent = user_profile.first_name;
              document.getElementById("my-lastname").textContent = user_profile.last_name;
              document.getElementById("my-score").textContent = user_profile.score;
            } else if (pathname === "/friends") {
              friend();
            } else if (pathname.substring(0,6) === "/user-") {
              showFoundUserData(finduser);
              contentElement.innerHTML += `<button class="cool-btn bg-success match-history-btn" data-url-path="match-history-${finduser.username}">Match History</button> `
            } else if (pathname === "/statistics") {
              addStatisticsData();
            } else if (pathname === "/matchs-history") {
              if (pathname_username) {
                matchHistoryLeftPanel(pathname_username);
              } else {
                matchHistoryLeftPanel(user_profile.username);
              }
              matchHistoryLeftPanel();
            } else if (pathname === "/leaderboard") {
              loadLeaderboard();
            }
            document.getElementById("panel-username").innerHTML =
              user_profile.username;
            document.getElementById("panel-pic").src =
              user_profile.profile_picture;
            document.getElementById("score-number").innerHTML =
              user_profile.score;

            setActiveTabFromURL();
            loadLanguage();
            contentElement.classList.add("fade-in");
            contentElement.style.opacity = 1;
          }, 100);
        })
        .catch((error) =>
          console.error(  
            "There has been a problem with your fetch operation:",
            error
          )
        );
    } else {
      fetch("/pages/404.html")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.text();
        })
        .then((html) => {
          contentElement.classList.remove("fade-in");
          contentElement.style.opacity = 0;

          setTimeout(() => {
            contentElement.innerHTML = html;
            document.title = "404 - Page Not Found";
            window.history.pushState(null, "", pathname);

            contentElement.classList.add("fade-in");
            contentElement.style.opacity = 1;
          }, 100);
        })
        .catch((error) =>
          console.error(
            "There has been a problem with your fetch operation:",
            error
          )
        );
    }
  }

  function setActiveTabFromURL() {
    const path = window.location.pathname;
    const items = document.querySelectorAll(".nav-item, [data-url-path]");
    let matchingItem = null;

    items.forEach((item) => {
      const targetPath =
        item.getAttribute("data-target-path") ||
        item.getAttribute("data-url-path");
      if (targetPath === path) {
        matchingItem = item;
      }
    });

    if (matchingItem) {
      handleIndicator(matchingItem);
    }
  }

  // MutationObserver ile dinamik olarak eklenen elemanları izleyin
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        const items = document.querySelectorAll(".nav-item, [data-url-path]");
        items.forEach((item) => {
          item.removeEventListener("click", handleItemClick);
          item.addEventListener("click", handleItemClick);
          if (item.classList.contains("is-active")) {
            handleIndicator(item);
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  async function handleItemClick(e) {
    e.preventDefault();
    let urlPath = window.location.pathname;
    const targetPath =
        this.getAttribute("data-target-path") ||
        this.getAttribute("data-url-path");
    if (targetPath === "/create-game") {
        let button = document.getElementById("home-friend-button");
        if (button)
          button.disabled = true;

        roomID = createSixDigitRandomNumber();
        loadPageBasedOnPath("/game-" + roomID);
        handleIndicator(this);
    }
    else if (targetPath.substring(0,6) == "/user-") {
      const inputValue = targetPath.substring(6);
      if (inputValue) {
          const newPath = `/user-${inputValue}`;
          loadPageBasedOnPath(newPath);
      }
    }
    else if (targetPath.substring(0, 14) === "/match-history") {
        const username = targetPath.substring(15);
        loadPageBasedOnPath("/match-history-" + username);
        await loadMatchHistory(username);
        handleIndicator(this);
    }
    else if (targetPath.substring(0, 10) === "/join-room") {
      let button = document.getElementById("home-ai-button");
      if (button)
        button.disabled = true;
      if (urlPath.substring(0, 6) == "/game-") {
          return;
      }
      if (targetPath.length > 10)
          roomID = targetPath.substring(11);
      else
          roomID = await joinButton();
      
        if (roomID.length > 0) {
          await loadPageBasedOnPath("/game-" + roomID);
        }

      handleIndicator(this);
    }
   else if (targetPath) {
        loadPageBasedOnPath(targetPath);
        handleIndicator(this);
    }
}


  setActiveTabFromURL();
  loadPageBasedOnPath(window.location.pathname);
  window.onpopstate = function (event) {
    if (event.state) {
      contentElement.classList.remove("show");

      setTimeout(() => {
        contentElement.innerHTML = event.state.html;
        document.title = event.state.pageTitle;

        contentElement.classList.add("show");
      }, 150);
    } else {
      loadPageBasedOnPath(window.location.pathname);
    }
  };
});
