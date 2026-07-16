// 로그인
// AppCommon.requireAuth();

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
const likeCountText = document.querySelector("#likeCount");
const viewCountText = document.querySelector("#viewCount");
const commentCountText = document.querySelector("#commentCount");

//댓글 태그
const commentTextarea = document.querySelector(".comment-write-box textarea");
const commentSubmitButton = document.querySelector(".comment-submit-row button");
const commentList = document.querySelector(".comment-list");

//게시글 수정, 삭제
const postDeleteButton = document.querySelector("#postDeleteButton");
const postDeleteModal = document.querySelector("#postDeleteModal");
const commentDeleteModal = document.querySelector("#commentDeleteModal");

// 로그인한 사용자, 게시글 id 가져오기
const accessToken = localStorage.getItem("accessToken");
let loginUser = null;
const params = new URLSearchParams(window.location.search);
const postId = params.get("postId");

let selectedCommentId = null;
let editingCommentId = null;
let isLiked = false;

// 게시글 존재 여부 확인
if (!postId) {
  alert("게시글 정보가 없습니다.");
  window.location.href = "./posts.html";
}

// 로그인한 사용자 프로필 불러오기
async function loadLoginUserProfile() {
  const user = await AppCommon.fetchCurrentUser();

  if (!user) return;

  loginUser = user;

  profileButton.src = AppCommon.getProfileImage(user.image);
}

// 게시글 상세 정보 조회
async function loadPostDetail() {
  try {
    const post = await AppCommon.request(`/posts/${postId}`);
    const author = {nickname: post.nickname,image: post.image};

    postTitle.textContent = post.subject;
    postText.textContent = post.text;

    postAuthorBox.innerHTML = `
      <img src="${AppCommon.getProfileImage(author?.image)}" alt="작성자 프로필" />
      <strong>${author?.nickname || `작성자 ${post.userId}`}</strong>
      <span>${AppCommon.formatDate(post.date, { withSeconds: true })}</span>
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

    if (loginUser?.userId !== post.userId) {
      postButtonBox.style.display = "none";
    } else {
      const editLink = postButtonBox.querySelector("a");
      editLink.href = `./edit.html?postId=${post.postId}`;
    }
  } catch (error) {
    console.error(error);
    if (error.status === 404) {
      alert("게시글을 찾을 수 없습니다.");
      window.location.href = "./posts.html";
    } else {
      alert("게시글을 불러오지 못했습니다.");
    }
  }
}

// 댓글 목록 조회
async function loadComments() {
  try {
    const comments = await AppCommon.request(`/posts/${postId}/comments`);

    commentList.innerHTML = "";
    commentCountText.textContent = comments.length;

    const fragment = document.createDocumentFragment();
    comments.forEach((comment) => fragment.appendChild(createCommentItem(comment)));
    commentList.appendChild(fragment);
  } catch (error) {
    console.error(error);
    commentList.innerHTML = "";
    commentCountText.textContent = 0;
  }
}

// 댓글 생성
function createCommentItem(comment) {
  const article = document.createElement("article");
  article.className = "comment-item";
  article.dataset.commentId = comment.commentId;

  const isOwner = loginUser?.userId === comment.userId;

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
        <img src="${AppCommon.getProfileImage(comment.image)}" alt="댓글 작성자 프로필" />
        <strong>${comment.nickname}</strong>
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

    await AppCommon.request(`/posts/${postId}/likes`, { method, auth: true });

    isLiked = !isLiked;
    const count = Number(likeCountText.textContent);
    likeCountText.textContent = isLiked ? count + 1 : count - 1;
    likeButton.classList.toggle("active", isLiked);
  } catch (error) {
    console.error(error);
    if (error.status === 409) alert("이미 좋아요를 누른 게시글입니다.");
    else if (error.status === 404) alert("좋아요 정보를 찾을 수 없습니다.");
    else alert("좋아요 처리에 실패했습니다.");
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
    await AppCommon.request(`/posts/${postId}/comments`, {
      method: "POST",
      auth: true,
      body: {
        commentText: commentText
      }
    });

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
    await AppCommon.request(`/posts/${postId}/comments/${commentId}`, {
        method: "PATCH",
        auth: true,
        body: {
          commentText: commentText,
        }
      });

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
    await AppCommon.request(`/posts/${postId}`, { method: "DELETE", auth: true });

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
    await AppCommon.request(`/posts/${postId}/comments/${selectedCommentId}`, {
      method: "DELETE",
      auth: true
    });

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
  try {
    isLiked = await AppCommon.request(`/posts/${postId}/likes`, { auth: true });
    likeButton.classList.toggle("active", isLiked);
  } catch (error) {
    console.error(error);
  }
}

// 프사 버튼 처리
AppCommon.setupProfileMenu({ profileButton, dropdown, logoutButton });

async function init() {
  await loadLoginUserProfile();
  await loadPostDetail();
  await loadComments();
  await loadLikeStatus();
}

init();
