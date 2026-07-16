const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector("#logoutButton");
const noticeTitle = document.querySelector("#noticeTitle");

const predictionSlide = document.querySelector("#predictionSlide");
const prevGameButton = document.querySelector("#prevGameButton");
const nextGameButton = document.querySelector("#nextGameButton");
const currentGameNumber = document.querySelector("#currentGameNumber");
const totalGameCount = document.querySelector("#totalGameCount");

const accessToken = localStorage.getItem("accessToken");

const TEAM_LOGOS = {
  KT: "./assets/images/teams/kt.svg",
  LG: "./assets/images/teams/lg.svg",
  KIA: "./assets/images/teams/kia.svg",
  SSG: "./assets/images/teams/ssg.svg",
  LOTTE: "./assets/images/teams/lotte.svg",
  SAMSUNG: "./assets/images/teams/samsung.svg",
  DOOSAN: "./assets/images/teams/doosan.svg",
  NC: "./assets/images/teams/nc.svg",
  KIWOOM: "./assets/images/teams/kiwoom.svg",
  HANWHA: "./assets/images/teams/hanwha.svg"
};

const TEAM_NAMES = {
  KT: "KT",
  LG: "LG",
  KIA: "KIA",
  SSG: "SSG",
  LOTTE: "롯데",
  SAMSUNG: "삼성",
  DOOSAN: "두산",
  NC: "NC",
  KIWOOM: "키움",
  HANWHA: "한화"
};

const MOCK_GAMES = [
  { gameId: 1, startTime: "18:30", stadiumName: "잠실", awayTeam: "KT", homeTeam: "LG", awayPitcher: "로건", homePitcher: "톨허스트" },
  { gameId: 2, startTime: "18:30", stadiumName: "문학", awayTeam: "KIA", homeTeam: "SSG", awayPitcher: "올러", homePitcher: "애벌라" },
  { gameId: 3, startTime: "18:30", stadiumName: "대구", awayTeam: "LOTTE", homeTeam: "SAMSUNG", awayPitcher: "로드리게스", homePitcher: "양창섭" },
  { gameId: 4, startTime: "18:30", stadiumName: "창원", awayTeam: "DOOSAN", homeTeam: "NC", awayPitcher: "곽빈", homePitcher: "라일리" },
  { gameId: 5, startTime: "18:30", stadiumName: "대전", awayTeam: "KIWOOM", homeTeam: "HANWHA", awayPitcher: "알칸타라", homePitcher: "화이트" }
];

let games = [];
let currentGameIndex = 0;

AppCommon.setupProfileMenu({ profileButton, dropdown, logoutButton });

async function loadLoginUserProfile() {
  await AppCommon.loadProfileImage(profileButton);
}

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
  try {
    games = await AppCommon.request("/games/today");

    if (!Array.isArray(games) || games.length === 0) {
      games = MOCK_GAMES;
    }
  } catch (error) {
    games = MOCK_GAMES;
  }

  currentGameIndex = 0;
  renderCurrentGame();
}

function renderCurrentGame() {
  if (!games.length || !predictionSlide) return;

  const game = games[currentGameIndex];
  const awayTeam = game.awayTeam;
  const homeTeam = game.homeTeam;

  predictionSlide.innerHTML = `
    <article class="prediction-card featured">
      <div class="game-meta">
        <div class="game-info">
          <span class="game-date">오늘</span>
          <span>${game.startTime} · ${game.stadiumName}</span>
        </div>
        <span class="game-status">예측 진행중</span>
      </div>

      <div class="matchup">
        <div class="team">
          <div class="team-title">
            <img src="${TEAM_LOGOS[awayTeam]}" class="team-logo" alt="${TEAM_NAMES[awayTeam]}" />
            <span class="team-code">${TEAM_NAMES[awayTeam]}</span>
          </div>
          <span class="starting-pitcher">선발 ${game.awayPitcher ?? "-"}</span>
        </div>

        <div class="versus">
          <strong>VS</strong>
          <span>${game.stadiumName}</span>
        </div>

        <div class="team">
          <div class="team-title">
            <img src="${TEAM_LOGOS[homeTeam]}" class="team-logo" alt="${TEAM_NAMES[homeTeam]}" />
            <span class="team-code">${TEAM_NAMES[homeTeam]}</span>
          </div>
          <span class="starting-pitcher">선발 ${game.homePitcher ?? "-"}</span>
        </div>
      </div>

      <div class="vote-buttons">
        <button type="button" class="vote-button" data-team="${awayTeam}">
          ${TEAM_NAMES[awayTeam]} 승
        </button>
        <button type="button" class="vote-button" data-team="${homeTeam}">
          ${TEAM_NAMES[homeTeam]} 승
        </button>
      </div>

      <div class="prediction-footer">
        <span>경기 시작 전까지 참여 가능</span>
        <span>적중 시 +100P</span>
      </div>

      <div class="vote-summary hidden">
        <span>참여 128명</span>
        <span>${TEAM_NAMES[awayTeam]} 45% · ${TEAM_NAMES[homeTeam]} 55%</span>
      </div>
    </article>
  `;

  currentGameNumber.textContent = String(currentGameIndex + 1);
  totalGameCount.textContent = String(games.length);

  bindVoteButtons();
}

function bindVoteButtons() {
  const buttons = predictionSlide.querySelectorAll(".vote-button");
  const summary = predictionSlide.querySelector(".vote-summary");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (!accessToken) {
        alert("로그인이 필요한 기능입니다.");
        window.location.href = "./login.html";
        return;
      }

      buttons.forEach(function (item) {
        item.classList.remove("selected");
      });

      button.classList.add("selected");
      summary.classList.remove("hidden");
    });
  });
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

loadLoginUserProfile();
loadLatestNotice();
loadTodayGames();
