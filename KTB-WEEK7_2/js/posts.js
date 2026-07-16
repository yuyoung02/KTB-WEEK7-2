const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector("#logoutButton");
const postList = document.querySelector(".post-list");

const stadiumButton = document.querySelector("#stadiumButton");
const stadiumDropdown = document.querySelector("#stadiumDropdown");
const stadiumItems = stadiumDropdown.querySelectorAll(".stadium-option");
const selectedStadiumBox = document.querySelector("#selectedStadium");

const keywordInput = document.querySelector("#keywordInput");
const searchButton = document.querySelector("#searchButton");
const prevPageButton = document.querySelector("#prevPage");
const nextPageButton = document.querySelector("#nextPage");
const pageNumbers = document.querySelector("#pageNumbers");

let selectedStadium = "";
let currentPage = 0;
const pageSize = 10;
let totalPages = 1;

AppCommon.setupProfileMenu({ profileButton, dropdown, logoutButton });

document.addEventListener("click", function (event) {
  dropdown.classList.add("hidden");

  if (!event.target.closest(".stadium-filter")) {
    stadiumDropdown.classList.add("hidden");
    stadiumButton.classList.remove("open");
    stadiumButton.setAttribute("aria-expanded", "false");
  }
});

stadiumButton.addEventListener("click", function (event) {
  event.stopPropagation();

  const isOpening = stadiumDropdown.classList.contains("hidden");

  stadiumDropdown.classList.toggle("hidden");
  stadiumButton.classList.toggle("open", isOpening);
  stadiumButton.setAttribute("aria-expanded", String(isOpening));
});

function selectStadiumItem(item) {
  selectedStadium = item.dataset.value;

  stadiumItems.forEach(function (stadiumItem) {
    stadiumItem.classList.remove("active");
  });

  item.classList.add("active");

  const logoWrap = item.querySelector(".option-logo-wrap");
  const optionName = item.querySelector(".option-name");

  selectedStadiumBox.innerHTML = `
    <span class="option-logo-wrap ${logoWrap.classList.contains("double") ? "double" : "single"}">
      ${logoWrap.innerHTML}
    </span>
    <span class="selected-stadium-name">${optionName.textContent}</span>
  `;

  stadiumDropdown.classList.add("hidden");
  stadiumButton.classList.remove("open");
  stadiumButton.setAttribute("aria-expanded", "false");
}

stadiumItems.forEach(function (item) {
  item.addEventListener("click", function (event) {
    event.stopPropagation();
    selectStadiumItem(item);
    currentPage = 0;
    loadPosts();
  });
});

function applyInitialStadiumFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const stadium = params.get("stadium");

  if (!stadium) return;

  const item = [...stadiumItems].find(
    (stadiumItem) => stadiumItem.dataset.value === stadium
  );

  if (item) {
    selectStadiumItem(item);
  }
}

searchButton.addEventListener("click", function () {
  currentPage = 0;
  loadPosts();
});

keywordInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    currentPage = 0;
    loadPosts();
  }
});

async function loadLoginUserProfile() {
  await AppCommon.loadProfileImage(profileButton);
}

function createPostCard(post) {
  const article = document.createElement("article");
  article.className = "post-card";

  article.innerHTML = `
    <a href="./postDetails.html?postId=${post.postId}" class="post-link">
      <div class="post-content">
        <div class="post-title-row">
          <h2>${post.subject}</h2>
          <span class="post-date">${AppCommon.formatDate(post.date)}</span>
        </div>

        <div class="post-stats">
          <span>좋아요 ${post.likeCount ?? 0}</span>
          <span>댓글 ${post.commentCount ?? 0}</span>
          <span>조회수 ${post.viewNum ?? 0}</span>
        </div>
      </div>

      <div class="post-author">
        <img
          src="${AppCommon.getProfileImage(post.image)}"
          alt="작성자 프로필"
          class="author-image"
        />
        <span>${post.userNickname ?? post.nickname ?? "알 수 없는 사용자"}</span>
      </div>
    </a>
  `;

  return article;
}

function renderPosts(posts) {
  postList.innerHTML = "";

  if (!posts.length) {
    postList.innerHTML = `
      <p style="text-align:center; color:#6b7280; padding:40px 0;">
        등록된 게시글이 없습니다.
      </p>
    `;
    return;
  }

  posts.forEach(function (post) {
    postList.appendChild(createPostCard(post));
  });
}

async function loadPosts() {
  const params = new URLSearchParams({
    page: String(currentPage),
    size: String(pageSize)
  });

  if (selectedStadium) {
    params.append("stadium", selectedStadium);
  }

  const keyword = keywordInput.value.trim();

  if (keyword) {
    params.append("keyword", keyword);
  }

  try {
    const data = await AppCommon.request(`/posts?${params.toString()}`);

    const posts = Array.isArray(data) ? data : (data.content ?? []);
    totalPages = Array.isArray(data) ? 1 : (data.totalPages ?? 1);
    currentPage = Array.isArray(data) ? 0 : (data.number ?? currentPage);

    renderPosts(posts);
    renderPagination();
  } catch (error) {
    console.error(error);
    postList.innerHTML = `
      <p style="text-align:center; color:#6b7280; padding:40px 0;">
        게시글을 불러오지 못했습니다.
      </p>
    `;
  }
}

function renderPagination() {
  pageNumbers.innerHTML = "";

  prevPageButton.disabled = currentPage <= 0;
  nextPageButton.disabled = currentPage >= totalPages - 1;

  const groupSize = 5;
  const startPage = Math.floor(currentPage / groupSize) * groupSize;
  const endPage = Math.min(startPage + groupSize, totalPages);

  for (let page = startPage; page < endPage; page++) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "page-number";
    button.textContent = String(page + 1);

    if (page === currentPage) {
      button.classList.add("active");
    }

    button.addEventListener("click", function () {
      currentPage = page;
      loadPosts();
    });

    pageNumbers.appendChild(button);
  }
}

prevPageButton.addEventListener("click", function () {
  if (currentPage <= 0) return;
  currentPage--;
  loadPosts();
});

nextPageButton.addEventListener("click", function () {
  if (currentPage >= totalPages - 1) return;
  currentPage++;
  loadPosts();
});

applyInitialStadiumFromQuery();
loadLoginUserProfile();
loadPosts();
