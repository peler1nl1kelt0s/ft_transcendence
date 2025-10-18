function triggerFileInput() {
  document.getElementById("fileInput").click();
}

function handleFileChange(inputElement) {
  const file = inputElement.files[0];

  if (!file) {
    alert("error: no file selected.");
    return;
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("error: file size is too large.");
    return;
  }

  const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!validImageTypes.includes(file.type)) {
    alert("error: not a valid image file.");
    return;
  }

  const formData = new FormData();
  formData.append("photo", file);

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64String = e.target.result.split(",")[1]; // Base64 verisi
    sendToBackend(base64String, file.type); // Backend'e gönder
  };
  reader.readAsDataURL(file);
}

async function sendToBackend(base64Data, fileType) {
  try {
    const response = await fetch("https://10.11.4.10/api/upload-photo/", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        photo: base64Data,
        file_type: fileType,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Fotoğraf başarıyla yüklendi.");
    } else {
      console.error("Hata:", data);
      alert(data.detail || "Bir hata oluştu.");
    }
  } catch (error) {
    console.error("Hata:", error);
    alert("Sunucuyla iletişimde bir hata oluştu.");
  }
}

function toggleEdit(editMode) {
  const elements = document.querySelectorAll("#table-username");
  const button = document.querySelector(".cool-btn");

  if (editMode) {
    elements.forEach((element) => {
      const input = document.createElement("input");
      input.value = element.textContent;
      input.className = "form-control";
      input.setAttribute("data-id", element.id);
      input.id = element.id;
      element.replaceWith(input);
    });
    button.textContent = "Save";
    button.onclick = () => toggleEdit(false);
  } else {
    elements.forEach((input) => {
      const td = document.createElement("td");
      td.textContent = input.value;
      td.id = input.getAttribute("data-id");
      input.replaceWith(td);
  
      fetch(`https://10.11.4.10/api/users/update/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_username: input.value }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((error) => {
              throw new Error(error.message || "Update request failed.");
            });
          }
          alert("Username updated successfully!");
        })
        .catch((error) => {
          console.error("Error during update process:", error);
          alert("An error occurred: " + error.message);
        });
    });
    button.textContent = "Edit";
    button.onclick = () => toggleEdit(true);
  }
}

function logout() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  fetch("https://10.11.4.10/api/logout/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        throw new Error("Logout request failed.");
      }
    })
    .catch((error) => {
      console.error("Error during logout process:", error);
      window.location.href = "/login";
    });
}

function addFriend() {
  const token = localStorage.getItem("token");
  var friendUsername = document.getElementById("friendUsername").value;

  if (!token) {
    alert("You must be logged in to add a friend.");
    return;
  }

  if (!friendUsername) {
    alert("Please enter a username!");
    return;
  }
  fetch(`https://10.11.4.10/api/add-friend/${friendUsername}`, {
  method: "POST",
  headers: {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
  },
  })
  .then((response) => {
    if (response.ok) {
      return response.json();
    }
  }).then((data) => {
    if (data.error)
      alert("error: " + data.error)
    else if (data.message)
      alert(data.message)
  })
  .catch((error) => {
    console.error("Error:", error);
    alert("An error occurred: " + error.message);
  });

}
