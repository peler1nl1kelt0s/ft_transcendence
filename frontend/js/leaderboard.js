function leaderboardHtml(leaderboard) {
    const sortedLeaderboard = Object.keys(leaderboard).sort((a, b) => {
        return leaderboard[b]["win"] - leaderboard[a]["win"]; // Büyükten küçüğe sıralama
    });



    return `
        <table>
            <thead>
                <tr>
                    <th data-lang="leaderboard-username">Username</th>
                    <th data-lang="leaderboard-wins">Wins</th>
                    <th data-lang="leaderboard-losses">Losses</th>
                    <th data-lang="leaderboard-draws">Draws</th>
                    <th data-lang="leaderboard-total">Total</th>
                    <th data-lang="leaderboard-winrate">Winrate</th>
                    <th data-lang="leaderboard-longest-streak">Longest Streak</th>
                </tr>
            </thead>
            <tbody>
                ${sortedLeaderboard.map(user => {
                    const userStats = leaderboard[user];
                    return `
                        <tr>
                            <td>
                                <p class="table-p">${user}</p>
                            </td>
                            <td>${userStats.win}</td>
                            <td>${userStats.loss}</td>
                            <td>${userStats.draw}</td>
                            <td>${userStats.total}</td>
                            <td>${userStats.winrate.toFixed(2)}%</td>
                            <td>${userStats.longestStreak}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}


async function getLeaderboardWithData() {
    try {
        const response = await fetch("https://10.11.4.10/api/leaderboard", {
            method: "GET",
            credentials: "include",
            headers: {
                Authorization: `Token ${auth_token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json(); // Yanıt JSON olarak ayrıştırılıyor

        return data;
    } catch (error) {
        return null;
    }
}

async function loadLeaderboard() {
    let leaderboardContainer = document.getElementsByClassName("leaderboard")[0];
    let leaderboard = await getLeaderboardWithData();

    leaderboardContainer.innerHTML += leaderboardHtml(leaderboard.data);
}