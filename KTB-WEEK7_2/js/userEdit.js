const API_BASE_URL = "http://localhost:8080";

const userEditForm = document.querySelector(".user-edit-form");

const profileImageInput = document.querySelector("#profileImage");
const profilePreview = document.querySelector(".profile-image-box img");

const nicknameInput = document.querySelector("#nickname");
const emailText = document.querySelector(".email-text");
const helperText = document.querySelector(".helper-text");

const withdrawButton = document.querySelector(".withdraw-button");
const withdrawModal = document.querySelector("#withdrawModal");

const cancelButton = withdrawModal.querySelector(".cancel-button");
const confirmButton = withdrawModal.querySelector(".confirm-button");


const toast = document.querySelector(".toast");

//프사 태그
const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector("#logoutButton");


// 회월 탈퇴 관련 태그
const passwordConfirmModal = document.querySelector("#passwordConfirmModal");
const withdrawPasswordInput = document.querySelector("#withdrawPassword");
const withdrawHelperText = document.querySelector(".withdraw-helper-text");
const passwordCancelButton = document.querySelector("#passwordCancelButton");
const passwordConfirmButton = document.querySelector("#passwordConfirmButton");

let profileImageUrl = null;

const loginUserId = localStorage.getItem("userId");

if (!loginUserId) {
  location.href = "./login.html";
}

// helper text 관련
function showHelper(message) {
  helperText.textContent = `* ${message}`;
  helperText.style.display = "block";
}

function hideHelper() {
  helperText.style.display = "none";
}

function showWithdrawHelper(message) {
  withdrawHelperText.textContent = `* ${message}`;
  withdrawHelperText.style.display = "block";
}

function hideWithdrawHelper() {
  withdrawHelperText.textContent = "";
  withdrawHelperText.style.display = "none";
}

// 닉네임 검증
function validateNickname() {
  const nickname = nicknameInput.value.trim();

  if (nickname === "") {
    showHelper("닉네임을 입력해주세요.");
    return false;
  }

  if (nickname.length > 30) {
    showHelper("닉네임은 최대 30자까지 가능합니다.");
    return false;
  }

  hideHelper();
  return true;
}

// 띄울 토스트
function showToast() {
  toast.style.display = "flex";

  setTimeout(() => {
    toast.style.display = "none";
  }, 1500);
}

// TODO : 이미지 구현 해야함ㅜㅜ
function getProfileImage(image) {
  return null;
}

// 사용자 정보 조회
async function loadUser() {
  const response = await fetch(`${API_BASE_URL}/users/${loginUserId}`);

  const user = await response.json();

  emailText.textContent = user.email;
  nicknameInput.value = user.nickname;

  profilePreview.src = getProfileImage(user.image);
  profileButton.src = getProfileImage(user.image);
  profileImageUrl = user.image;
}

// 2-1 이벤트 처리
profileImageInput.addEventListener("change", function () {

  const file = profileImageInput.files[0];

  if (!file) return;

  // TODO : 이미지 구현
  profileImageUrl = null;

  profilePreview.src = profileImageUrl;
});

nicknameInput.addEventListener("input", validateNickname);

// 사용자 정보 수정 폼 제출
userEditForm.addEventListener("submit", async function (event) {

  event.preventDefault();

  if (!validateNickname()) {
    return;
  }

  // 성공하면 -> patch 보냄
  const response = await fetch(
    `${API_BASE_URL}/users/${loginUserId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestUserId: Number(loginUserId),
        nickname: nicknameInput.value.trim(),
        image: null // TODO : 이미지 구현
      })
    }
  );

  if (response.status === 409) {
    showHelper("이미 사용중인 닉네임입니다.");
    return;
  }

  if (response.status === 403) {
    showHelper("수정 권한이 없습니다.");
    return;
  }

  if (!response.ok) {
    showHelper("회원정보 수정에 실패했습니다.");
    return;
  }

  showToast();
  loadUser();
});

withdrawButton.addEventListener("click", function () {
  withdrawModal.classList.remove("hidden");
});

cancelButton.addEventListener("click", function () {
  withdrawModal.classList.add("hidden");
});

// 회원 탈퇴 모달
withdrawModal.addEventListener("click", function(event) {
  if (event.target === withdrawModal) {
    withdrawModal.classList.add("hidden");
  }
});

confirmButton.addEventListener("click", function () {
  withdrawModal.classList.add("hidden");
  passwordConfirmModal.classList.remove("hidden");
  withdrawPasswordInput.value = "";
  hideWithdrawHelper();
});

passwordCancelButton.addEventListener("click", function() {
  passwordConfirmModal.classList.add("hidden");
});

// 확인 -> 비밀번호 입력 모달로
passwordConfirmModal.addEventListener("click", function (event) {
  if (event.target === passwordConfirmModal) {
    passwordConfirmModal.classList.add("hidden");
  }
});

// 비밀 번호 확인 -> 성공 후 탈퇴 처리
passwordConfirmButton.addEventListener("click", async function () {
  const password = withdrawPasswordInput.value;

  if (password.trim() === "") {
    showWithdrawHelper("비밀번호를 입력해주세요.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/${loginUserId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestUserId: Number(loginUserId),
        password: password
      })
    });

    if (response.status === 401) {
      showWithdrawHelper("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (response.status === 403) {
      showWithdrawHelper("삭제 권한이 없습니다.");
      return;
    }

    if (!response.ok) {
      showWithdrawHelper("회원탈퇴에 실패했습니다.");
      return;
    }
    localStorage.clear(); // 브라우저에 저장된 로그인 기록 지우기
    window.location.href = "./login.html";
  } catch (error) {
    console.error(error);
    showWithdrawHelper("서버와 연결할 수 없습니다.");
  }
});

// 프사 버튼
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
  location.href = "./login.html";
});

loadUser();