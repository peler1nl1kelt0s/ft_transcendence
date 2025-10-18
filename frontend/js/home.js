async function joinButton() {
    var roomInput = document.getElementById("room-number");
    var roomID = roomInput.value;
    try {
        roomID = roomID.replace(/[^0-9]/g, ""); // Sadece harf ve rakamları bırakır
        roomID = roomID.trim();
        if (!roomID) {
            alert("Room Name cannot be empty or contain invalid characters.");
        }
        return roomID;
    }
    catch (error) {
    }
}