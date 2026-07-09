const API_BASE_URL = "http://localhost:8080";
// const DEFAULT_PROFILE_IMAGE = "./assets/images/defaultProfileImage.png";

const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector("#logoutButton");
const postList = document.querySelector(".post-list");

const accessToken = localStorage.getItem("accessToken");

// 로그인 여부 확인
if (!accessToken) {
  alert("로그인이 필요합니다.");
  window.location.href = "./login.html";
}

// 프사 버튼 -> 드롭다운
profileButton.addEventListener("click", function (event) {
  event.stopPropagation();
  dropdown.classList.toggle("hidden");
});

document.addEventListener("click", function () {
  dropdown.classList.add("hidden");
});

logoutButton.addEventListener("click", function (event) {
  event.preventDefault();

  localStorage.clear();
  window.location.href = "./login.html";
});

// TODO : 이미지 구현
function getProfileImage(image) {
  return null;
}

// 날짜 포맷
function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  return dateString.replace("T", " ").slice(0, 19);
}

// 사용자 정보 조회
async function fetchUser(accessToken) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// 댓글 개수 조회
async function fetchCommentCount(postId) {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);

    if (!response.ok) {
      return 0;
    }

    const comments = await response.json();
    return comments.length;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

// 게시글 카드 생성
function createPostCard(post, commentCount) {
  const article = document.createElement("article");
  article.className = "post-card";
  
  const nickname = post.userNickname;

  const authorImage = getProfileImage(post.image);

  article.innerHTML = `
    <a href="./postDetails.html?postId=${post.postId}" class="post-link">
      <div class="post-content">
        <div class="post-title-row">
          <h2>${post.subject}</h2>
          <span class="post-date">${formatDate(post.date)}</span>
        </div>

        <div class="post-stats">
          <span>좋아요 ${post.likeCount}</span>
          <span>댓글 ${commentCount}</span>
          <span>조회수 ${post.viewNum}</span>
        </div>
      </div>

      <div class="post-author">
        <img
          src="${authorImage}"
          alt="작성자 프로필"
          class="author-image"
        />
        <span>${nickname}</span>
      </div>
    </a>
  `;

  return article;
}

// 로그인한 사용자 프로필 조회
async function loadLoginUserProfile() {
  const user = await fetchUser(accessToken);

  if (!user) {
    return;
  }

  profileButton.src = getProfileImage(user.image);

  localStorage.setItem("nickname", user.nickname);
  if (user.image) {
    localStorage.setItem("profileImage", user.image);
  }
}

// 게시글 목록 조회
async function loadPosts() {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`);

    if (!response.ok) {
      postList.innerHTML = `<p>게시글을 불러오지 못했습니다.</p>`;
      return;
    }

    const posts = await response.json();
    

    postList.innerHTML = "";

    if (posts.length === 0) {
      postList.innerHTML = `<p>작성된 게시글이 없습니다.</p>`;
      return;
    }

    for (const post of posts) {
      const commentCount = await fetchCommentCount(post.postId);

      const postCard = createPostCard(post, commentCount);
      postList.appendChild(postCard);
    }
  } catch (error) {
    console.error(error);
    postList.innerHTML = `<p>서버와 연결할 수 없습니다.</p>`;
  }
}

loadLoginUserProfile();
loadPosts();