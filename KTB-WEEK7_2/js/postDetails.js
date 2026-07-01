const API_BASE_URL = "http://localhost:8080";
//const DEFAULT_PROFILE_IMAGE = "./assets/images/defaultProfileImage.png";

// 프사 태그
const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector(".dropdown li:last-child a");

const postTitle = document.querySelector(".post-top h2");
const postAuthorBox = document.querySelector(".post-info-row .author-box");
const postButtonBox = document.querySelector(".post-button-box");
const postImageBox = document.querySelector(".post-image");
const postText = document.querySelector(".post-text");

// 좋아요 태그
const likeButton = document.querySelector(".like-count");
const likeCountText = likeButton.querySelector("strong");
const viewCountText = document.querySelectorAll(".count-box strong")[1];
const commentCountText = document.querySelectorAll(".count-box strong")[2];

//댓글 태그
const commentTextarea = document.querySelector(".comment-write-box textarea");
const commentSubmitButton = document.querySelector(".comment-submit-row button");
const commentList = document.querySelector(".comment-list");

//게시글 수정, 삭제
const postDeleteButton = document.querySelector("#postDeleteButton");
const postDeleteModal = document.querySelector("#postDeleteModal");
const commentDeleteModal = document.querySelector("#commentDeleteModal");

// 로그인한 사용자, 게시글 id 가져오기
const loginUserId = localStorage.getItem("userId");
const params = new URLSearchParams(window.location.search);
const postId = params.get("postId");

let selectedCommentId = null;
let editingCommentId = null;
let isLiked = false;

// 로그인 여부 확인 -> index 뭘로 할지 정하기
if (!loginUserId) {
  alert("로그인이 필요합니다.");
  window.location.href = "./login.html";
}

// 게시글 존재 여부 확인
if (!postId) {
  alert("게시글 정보가 없습니다.");
  window.location.href = "./posts.html";
}

//TODO : 이미지 구현
function getProfileImage(image) {
  return null;
}

//날짜 포맷
function formatDate(dateString) {
  if (!dateString) return "";
  return dateString.replace("T", " ").slice(0, 19);
}

// 사용자 정보 조회
async function fetchUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// 로그인한 사용자 프로필 불러오기
async function loadLoginUserProfile() {
  const user = await fetchUser(loginUserId);

  if (!user) return;

  profileButton.src = getProfileImage(user.image);
}

// 게시글 상세 정보 조회
async function loadPostDetail() {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`);

    if (response.status === 404) {
      alert("게시글을 찾을 수 없습니다.");
      window.location.href = "./posts.html";
      return;
    }

    if (!response.ok) {
      alert("게시글을 불러오지 못했습니다.");
      return;
    }

    const post = await response.json();
    const author = await fetchUser(post.userId);

    postTitle.textContent = post.subject;
    postText.textContent = post.text;

    postAuthorBox.innerHTML = `
      <img src="${getProfileImage(author?.image)}" alt="작성자 프로필" />
      <strong>${author?.nickname || `작성자 ${post.userId}`}</strong>
      <span>${formatDate(post.date)}</span>
    `;

    if (post.image) {
      postImageBox.innerHTML = `<img src="${post.image}" alt="게시글 이미지" />`;
      postImageBox.style.display = "block";
    } else {
      postImageBox.innerHTML = "";
      postImageBox.style.display = "none";
    }

    // 좋아요수, 조회수
    likeCountText.textContent = post.likeCount;
    viewCountText.textContent = post.viewNum;

    if (Number(loginUserId) !== post.userId) {
      postButtonBox.style.display = "none";
    } else {
      const editLink = postButtonBox.querySelector("a");
      editLink.href = `./edit.html?postId=${post.postId}`;
    }
  } catch (error) {
    console.error(error);
    alert("서버와 연결할 수 없습니다.");
  }
}

// 댓글 목록 조회
async function loadComments() {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);

    if (!response.ok) {
      commentList.innerHTML = "";
      commentCountText.textContent = 0;
      return;
    }

    const comments = await response.json();

    commentList.innerHTML = "";
    commentCountText.textContent = comments.length;

    for (const comment of comments) {
      const user = await fetchUser(comment.userId);
      const commentItem = createCommentItem(comment, user);
      commentList.appendChild(commentItem);
    }
  } catch (error) {
    console.error(error);
  }
}

// 댓글 생성
function createCommentItem(comment, user) {
  const article = document.createElement("article");
  article.className = "comment-item";
  article.dataset.commentId = comment.commentId;

  const isOwner = Number(loginUserId) === comment.userId;

  let buttonHtml = "";

  if (isOwner) {
    buttonHtml = `
      <div class="comment-button-box">
        <button type="button" class="small-button comment-edit-button">수정</button>
        <button type="button" class="small-button comment-delete-button">삭제</button>
      </div>
    `;
  }

  article.innerHTML = `
    <div class="comment-top">
      <div class="author-box">
        <img src="${getProfileImage(user?.image)}" alt="댓글 작성자 프로필" />
        <strong>${user?.nickname || `작성자 ${comment.userId}`}</strong>
        <span></span>
      </div>

      ${buttonHtml}
    </div>

    <p class="comment-text">${comment.commentText}</p>
  `;

  return article;
}

// 좋아요 버튼 이벤트 처리 -> 누르면 활성화 아니면 활성화 끄기
likeButton.addEventListener("click", async function () {
  try {
    const method = isLiked ? "DELETE" : "POST";

    const response = await fetch(
      `${API_BASE_URL}/posts/${postId}/likes?userId=${loginUserId}`,
      {
        method: method
      }
    );

    if (response.status === 204) {
      isLiked = !isLiked;

      let count = Number(likeCountText.textContent);
      likeCountText.textContent = isLiked ? count + 1 : count - 1;

      likeButton.classList.toggle("active", isLiked);
      return;
    }

    if (response.status === 409) {
      alert("이미 좋아요를 누른 게시글입니다.");
      return;
    }

    if (response.status === 404) {
      alert("좋아요 정보를 찾을 수 없습니다.");
      return;
    }

    alert("좋아요 처리에 실패했습니다.");
  } catch (error) {
    console.error(error);
    alert("서버와 연결할 수 없습니다.");
  }
});

// 댓글 등록 버튼 이벤트 처리
commentSubmitButton.addEventListener("click", async function () {
  const commentText = commentTextarea.value.trim();

  if (commentText === "") return;

  if (editingCommentId) {
    await updateComment(editingCommentId, commentText);
    return;
  }

  await createComment(commentText);
});

// 댓글 작성
async function createComment(commentText) {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: Number(loginUserId),
        commentText: commentText,
      }),
    });

    if (!response.ok) {
      alert("댓글 등록에 실패했습니다.");
      return;
    }

    commentTextarea.value = "";
    await loadComments();
  } catch (error) {
    console.error(error);
    alert("서버와 연결할 수 없습니다.");
  }
}

// 댓글 수정
async function updateComment(commentId, commentText) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/posts/${postId}/comments/${commentId}?userId=${loginUserId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentText: commentText,
        }),
      }
    );

    if (!response.ok) {
      alert("댓글 수정에 실패했습니다.");
      return;
    }

    editingCommentId = null;
    commentSubmitButton.textContent = "댓글 등록";
    commentTextarea.value = "";

    await loadComments();
  } catch (error) {
    console.error(error);
    alert("서버와 연결할 수 없습니다.");
  }
}

// 댓글 수정, 삭제 버튼 이벤트 처리
commentList.addEventListener("click", function (event) {
  const commentItem = event.target.closest(".comment-item");

  if (!commentItem) return;

  if (event.target.classList.contains("comment-delete-button")) {
    selectedCommentId = commentItem.dataset.commentId;
    commentDeleteModal.classList.remove("hidden");
    return;
  }

  if (event.target.classList.contains("comment-edit-button")) {
    editingCommentId = commentItem.dataset.commentId;

    const currentCommentText =
      commentItem.querySelector(".comment-text").textContent;

    commentTextarea.value = currentCommentText;
    commentSubmitButton.textContent = "댓글 수정";
    commentTextarea.focus();
  }
});

postDeleteButton.addEventListener("click", function () {
  postDeleteModal.classList.remove("hidden");
});

// 게시글 삭제 모달 열기
postDeleteModal.querySelector(".confirm-button").addEventListener("click", async function () {
  try {
    const response = await fetch(
      `${API_BASE_URL}/posts/${postId}?userId=${loginUserId}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      alert("게시글 삭제에 실패했습니다.");
      return;
    }

    window.location.href = "./posts.html";
  } catch (error) {
    console.error(error);
    alert("서버와 연결할 수 없습니다.");
  }
});

// 댓글 삭제 모달
commentDeleteModal.querySelector(".confirm-button").addEventListener("click", async function () {
  if (!selectedCommentId) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/posts/${postId}/comments/${selectedCommentId}?userId=${loginUserId}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      alert("댓글 삭제에 실패했습니다.");
      return;
    }

    selectedCommentId = null;
    closeAllModals();
    await loadComments();
  } catch (error) {
    console.error(error);
    alert("서버와 연결할 수 없습니다.");
  }
});

document.querySelectorAll(".cancel-button").forEach((button) => {
  button.addEventListener("click", closeAllModals);
});

document.querySelectorAll(".modal-overlay").forEach((modal) => {
  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeAllModals();
    }
  });
});

// 모달 닫기
function closeAllModals() {
  postDeleteModal.classList.add("hidden");
  commentDeleteModal.classList.add("hidden");
}

// 좋어요 여부 확인
async function loadLikeStatus() {
  const response = await fetch(
    `${API_BASE_URL}/posts/${postId}/likes?userId=${loginUserId}`
  );

  if (!response.ok) return;

  isLiked = await response.json();
  likeButton.classList.toggle("active", isLiked);
}

// 프사 버튼 처리
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

loadLoginUserProfile();
loadPostDetail();
loadComments();
loadLikeStatus();