const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector("#logoutButton");
const noticeTitle = document.querySelector("#noticeTitle");

const predictionSlide = document.querySelector("#predictionSlide");
const prevGameButton = document.querySelector("#prevGameButton");
const nextGameButton = document.querySelector("#nextGameButton");
const currentGameNumber = document.querySelector("#currentGameNumber");
const totalGameCount = document.querySelector("#totalGameCount");

let games = [];
let currentGameIndex = 0;

AppCommon.setupProfileMenu({ profileButton, dropdown, logoutButton });

async function loadLatestNotice() {
  try {
    const data = await AppCommon.request("/notices?page=0&size=1");
    const notices = Array.isArray(data) ? data : (data.content ?? []);

    if (notices.length > 0) {
      noticeTitle.textContent = notices[0].title;
    }
  } catch (error) {
    noticeTitle.textContent = "오늘의 주요 공지사항을 확인해보세요.";
  }
}

async function loadTodayGames() {
  games = await AppPrediction.loadGames();
  currentGameIndex = 0;
  renderCurrentGame();
}

function renderCurrentGame() {
  if (!games.length || !predictionSlide) return;

  const game = games[currentGameIndex];
  predictionSlide.innerHTML = `
    <article class="prediction-card featured">
      <div class="game-meta">
        <div class="game-info">
          <span class="game-date">오늘</span>
          <span>${game.startTime} · ${game.stadiumName}</span>
        </div>
        <span class="game-status">예측 진행중</span>
      </div>

      ${AppPrediction.createPredictionBody(game, `<div class="prediction-footer">
        <span>경기 시작 전까지 참여 가능</span>
        <span>적중 시 +100P</span>
      </div>`)}
    </article>
  `;

  currentGameNumber.textContent = String(currentGameIndex + 1);
  totalGameCount.textContent = String(games.length);

  AppPrediction.bindVoteButtons(predictionSlide);
}

prevGameButton?.addEventListener("click", function () {
  currentGameIndex =
    (currentGameIndex - 1 + games.length) % games.length;

  renderCurrentGame();
});

nextGameButton?.addEventListener("click", function () {
  currentGameIndex =
    (currentGameIndex + 1) % games.length;

  renderCurrentGame();
});

AppCommon.loadProfileImage(profileButton);
loadLatestNotice();
loadTodayGames();
