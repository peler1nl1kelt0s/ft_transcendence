function openPopUpWithUsername(username) {
  fetch(`https://10.11.4.10/api/users/${username}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Token ${auth_token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Friends list could not be fetched.");
      }
    })
    .then((data) => {
      if (data.profile_picture) {
        picture = data.profile_picture;
      } else if (data.profile.profile_picture) {
        picture = data.profile.profile_picture;
      }

      const modalBody = document.getElementById("modalContent");
      modalBody.innerHTML = `
        <div class="modal-header" style="background: #121d2b;">
          <h5 class="modal-title" id="friendInfoModalLabel">${data.first_name} ${data.last_name}</h5>
        <button type="button" class="btn-close cool-btn bg-danger" data-bs-dismiss="modal" style="width: 2vw; height: 3vh;" aria-label="Close" s
          tyle="width: 2vw; height: 3vh;"
          ></button>
        </div>
        <div class="modal-body">
            <div class="profile-container">
                <div class="profile-header">
                    <img src="${picture}" alt="Profile Picture" class="profile-picture picture">
                    <h4 class="username">${data.first_name} ${data.last_name}</h4>
                    <h5 class="username">${data.username}</h5>
                    <div class="d-flex flex-column align-items-center">
                        <button class="cool-btn" onclick="toggleEdit(true)" style="width: 100%; max-width: 28vh; margin-bottom: 0;">Add Friend</button>
                    </div>
                </div>
                <div class="profile-info">
                    <table>
                      <tr>
                        <th>Level</th>
                        <td>${data.profile.level}</td>
                      </tr>
                      <tr>
                        <th>Grade</th>
                        <td>${data.profile.grade}</td>
                      </tr>
                      <tr>
                        <th>Campus</th>
                        <td>${data.profile.campus}</td>
                      </tr>
                    </table>
                </div>
            </div>
        </div>
        `;

      const friendInfoModal = new bootstrap.Modal(
        document.getElementById("friendInfoModal")
      );
      friendInfoModal.show();
    })
    .catch((error) => {
      alert(error.message);
    });
}
