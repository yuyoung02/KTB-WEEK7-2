const API_BASE_URL = "http://localhost:8080";


// HTML 태그들
const DEFAULT_PROFILE_IMAGE = "./assets/images/defaultProfileImage.png";

const editForm = document.querySelector(".edit-form");

const titleInput = document.querySelector("#title");
const contentTextarea = document.querySelector("#content");
const imageInput = document.querySelector("#image");
const fileName = document.querySelector(".file-name");
const helperText = document.querySelector(".helper-text");

const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector("#logoutButton");
const backButton = document.querySelector("#backButton");

// 로그인 한 사람 기억 -> 이후 JWT로 바꿀 예정..?
const loginUserId = localStorage.getItem("userId");
const params = new URLSearchParams(window.location.search);
const postId = params.get("postId");

// TODO: 이미지 구현 해야된다..
let patchImageUrl = null;

// 로그인 확인
if (!loginUserId) {
  alert("로그인이 필요합니다.");
  window.location.href = "./login.html";
}

// URL에서 수정할 게시글 ID 가져오기
if (!postId) {
  alert("게시글 정보가 없습니다.");
  window.location.href = "./posts.html";
}

//기존 게시글 정보 불러오기
backButton.href = `./postDetails.html?postId=${postId}`;
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

    if (Number(loginUserId) !== post.userId) {
      alert("게시글 작성자만 수정할 수 있습니다.");
      window.location.href = `./postDetails.html?postId=${postId}`;
      return;
    }

    titleInput.value = post.subject;
    contentTextarea.value = post.text;

    if (post.image) {
      fileName.textContent = "기존 이미지 있음";
      patchImageUrl = post.image;
    } else {
      fileName.textContent = "파일을 선택해주세요.";
      patchImageUrl = null;
    }
  } catch (error) {
    console.error(error);
    alert("서버와 연결할 수 없습니다.");
  }
}

// TODO: 이미지 구현 해야된다..
function getProfileImage(image) {
  return null;
}

// helper text
function showHelper(message) {
  helperText.textContent = `* ${message}`;
  helperText.style.display = "block";
}

function hideHelper() {
  helperText.textContent = "";
  helperText.style.display = "none";
}

// 게시글 내용 검증 (필수 내역 확인)
function validateEditForm() {
  const content = contentTextarea.value.trim();

  if (content === "") {
    showHelper("내용을 입력해주세요.");
    return false;
  }

  hideHelper();
  return true;
}

// 회원정보 가져오기
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

async function loadLoginUserProfile() {
  const user = await fetchUser(loginUserId);

  if (!user) return;

  profileButton.src = getProfileImage(user.image);
}

// 이벤트 처리
// 게시글 내용 검증 (필수 내역 확인)
imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];

  if (!file) {
    fileName.textContent = "파일을 선택해주세요.";
    patchImageUrl = null;
    return;
  }

  fileName.textContent = file.name;
  patchImageUrl = URL.createObjectURL(file);
});

contentTextarea.addEventListener("input", validateEditForm);

// 수정하기 버튼 -> patch 요청 ->성공 시 상세 페이지로 이동
editForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!validateEditForm()) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestUserId: Number(loginUserId),
        patchSubject: titleInput.value.trim(),
        patchText: contentTextarea.value.trim(),
        patchImage: patchImageUrl,
      }),
    });

    if (response.status === 403) {
      showHelper("게시글 작성자만 수정할 수 있습니다.");
      return;
    }

    if (response.status === 400) {
      showHelper("수정할 내용을 입력해주세요.");
      return;
    }

    if (response.status === 404) {
      showHelper("게시글을 찾을 수 없습니다.");
      return;
    }

    if (!response.ok) {
      showHelper("게시글 수정에 실패했습니다.");
      return;
    }

    window.location.href = `./postDetails.html?postId=${postId}`;
  } catch (error) {
    console.error(error);
    showHelper("서버와 연결할 수 없습니다.");
  }
});

//프사 클릭 -> 드롭다운
profileButton.addEventListener("click", function (event) {
  event.stopPropagation(); // -> 프사 계속 닫히는 것 방지
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