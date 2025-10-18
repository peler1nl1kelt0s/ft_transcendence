let winCount = 0;
let lossCount = 0;
let drawCount = 0;

let usersData = {};

async function getUserMatches(username) {
    return fetch(`https://10.11.4.10/api/match/find/${username}`, {
        method: "GET",
        credentials: "include",
        headers: {
            Authorization: `Token ${auth_token}`,
            "Content-Type": "application/json",
        },
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return null;
            }
        })
        .then(data => {
            if (data) {
                return data;
            } else {
                return null;
            }
        })
        .catch(error => {
            return null;
        });
}

async function addStatisticsData() {
    const userMatches = await getUserMatches(user_profile.username);
    if (!userMatches)
        return;
    let textContainers = document.querySelectorAll(".text-container");

    winCount = userMatches.filter(match => match.winner && match.winner.username === user_profile.username).length;
    lossCount = userMatches.filter(match => match.winner && match.winner.username !== user_profile.username).length;
    drawCount = userMatches.filter(match => !match.winner).length;

    textContainers.forEach((container) => {
        const h6Element = container.querySelector("h6[data-lang]");
        const dataLang = h6Element ? h6Element.getAttribute("data-lang") : null;

        if (dataLang) {
            let content = '';
            if (dataLang === "statistics-wins") {
                content = winCount;
            } else if (dataLang === "statistics-losses") {
                content = lossCount;
            } else if (dataLang === "statistics-draws") {
                content = drawCount;
            } else if (dataLang === "statistics-total-number-of-games-played") {
                content = userMatches.length;
            } else if (dataLang === "statistics-longest-winning-streak") {
                let streak = 0;
                let currentStreak = 0;
                userMatches.forEach(match => {
                    if (match.winner === user_profile.username) {
                        currentStreak++;
                        streak = Math.max(streak, currentStreak);
                    } else {
                        currentStreak = 0;
                    }
                });
                content = streak;
            } else if (dataLang === "statistics-win-rate") {
                const totalMatches = winCount + lossCount + drawCount;
                const winRate = totalMatches > 0 ? ((winCount / totalMatches) * 100).toFixed(2) : "0.00";
                content = `${winRate}%`;
            } else if (dataLang === "statistics-player-played-minutes-in-total") {
                let totalSeconds = 0;
                userMatches.forEach(match => {
                    totalSeconds += match.played_time;
                });
                let time = fixedPlayedTime(totalSeconds);
                content = `${time.minutes}m ${time.seconds}sec`;
            }

            const cardNumberElement = container.querySelector("span.card-number");
            if (cardNumberElement) {
                cardNumberElement.innerHTML = content;
            }
            usersData[user_profile.username] = {
                wins: winCount,
                losses: lossCount,
                draws: drawCount,
            }
        }
    });
}
