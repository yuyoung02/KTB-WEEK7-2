// 백서버 url
const API_BASE_URL = "http://localhost:8080";

// NOTE : HTML 태그들
const signupForm = document.querySelector(".signup-form");

const profileInput = document.querySelector("#profile");
const profileUpload = document.querySelector(".profile-upload");
// 이미지 처리 일단은 null로.. 
let profileImageUrl = null;

const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const passwordCheckInput = document.querySelector("#password-check");
const nicknameInput = document.querySelector("#nickname");

const helperTexts = document.querySelectorAll(".helper-text");

const signupSuccessModal = document.querySelector("#signupSuccessModal");
const signupSuccessConfirm = document.querySelector("#signupSuccessConfirm");

// helper text
function showHelper(index, message) {
  helperTexts[index].textContent = `* ${message}`;
  helperTexts[index].style.display = "block";
}

function hideHelper(index) {
  helperTexts[index].textContent = "";
  helperTexts[index].style.display = "none";
}


// 이메일 형식 검사
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 비번 형식 검사
function isValidPassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,20}$/.test(password);
}

// 이메일 검증
function validateEmail() {
  const email = emailInput.value.trim();

  if (email === "") {
    showHelper(1, "이메일을 입력해주세요.");
    return false;
  }

  if (!isValidEmail(email)) {
    showHelper(1, "올바른 이메일 형식을 입력해주세요.");
    return false;
  }

  hideHelper(1);
  return true;
}

//비번 검증
function validatePassword() {
  const password = passwordInput.value;

  if (password === "") {
    showHelper(2, "비밀번호를 입력해주세요.");
    return false;
  }

  if (!isValidPassword(password)) {
    showHelper(2, "비밀번호는 8~20자, 영문/숫자/특수문자를 포함해야 합니다.");
    return false;
  }

  hideHelper(2);
  return true;
}

// 비밀번호 재입력 검증
function validatePasswordCheck() {
  const password = passwordInput.value;
  const passwordCheck = passwordCheckInput.value;

  if (passwordCheck === "") {
    showHelper(3, "비밀번호를 한번 더 입력해주세요.");
    return false;
  }

  if (password !== passwordCheck) {
    showHelper(3, "비밀번호가 일치하지 않습니다.");
    return false;
  }

  hideHelper(3);
  return true;
}

// 닉네임 검증 -> 30자 (내 DDL)
function validateNickname() {
  const nickname = nicknameInput.value.trim();

  if (nickname === "") {
    showHelper(4, "닉네임을 입력해주세요.");
    return false;
  }

  if (nickname.length > 30) {
    showHelper(4, "닉네임은 최대 30자까지 가능합니다.");
    return false;
  }

  hideHelper(4);
  return true;
}


// 올리기전 최종 검사
function validateSignupForm() {
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isPasswordCheckValid = validatePasswordCheck();
  const isNicknameValid = validateNickname();

  return (
    isEmailValid && isPasswordValid && isPasswordCheckValid && isNicknameValid);
}


// 2-1. 이벤트 처리
// 프사 미리보기
profileInput.addEventListener("change", function() {
  const file = profileInput.files[0];

  if (!file) return;

  const previewUrl = URL.createObjectURL(file);

  profileUpload.innerHTML = `<img src="${previewUrl}" alt="프로필 미리보기" />`;
});

emailInput.addEventListener("input", validateEmail);

passwordInput.addEventListener("input", function () {
  validatePassword();

  if (passwordCheckInput.value !== "") {
    validatePasswordCheck();
  }
});

// 비번, 닉네임 검증
passwordCheckInput.addEventListener("input", validatePasswordCheck);
nicknameInput.addEventListener("input", validateNickname);

// 회원가입 폼 제출
signupForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!validateSignupForm()) {
    return;
  }

  // TODO : 이미지 
  const image = null;

  try {
    const response = await fetch(`${API_BASE_URL}/users/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value,
        nickname: nicknameInput.value.trim(),
        // TODO : 이미지 
        image: null
      })
    });

    if (response.status === 409) {
      showHelper(1, "이미 사용 중인 이메일 또는 닉네임입니다.");
      return;
    }

    if (response.status === 400) {
      showHelper(1, "입력값을 다시 확인해주세요.");
      return;
    }

    if (!response.ok) {
      showHelper(1, "회원가입에 실패했습니다.");
      return;
    }

    signupSuccessModal.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    showHelper(1, "서버와 연결할 수 없습니다.");
  }
});

// 회원가입 성공 -> 로그인 페이지로 
signupSuccessConfirm.addEventListener("click", function () {
  window.location.href = "./login.html";
});