// 로그인
// AppCommon.requireAuth();

// localStorage에서 로그인한 사용자 id 가져오기
const accessToken = localStorage.getItem("accessToken");


// HTML 태그
const passwordForm = document.querySelector(".password-form");

const currentPasswordInput = document.querySelector("#current-password");
const newPasswordInput = document.querySelector("#new-password");
const newPasswordCheckInput = document.querySelector("#new-password-check");

const helperTexts = document.querySelectorAll(".helper-text");
const toast = document.querySelector(".toast");

const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector(".dropdown li:last-child a");

// helper text
function showHelper(index, message) {
  helperTexts[index].textContent = `* ${message}`;
  helperTexts[index].style.display = "block";
}

function hideHelper(index) {
  helperTexts[index].textContent = "";
  helperTexts[index].style.display = "none";
}

// 비밀번호 형식 검사
function isValidPassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,20}$/.test(password);
}

// 기존 비밀번호 입력 여부 검사
function validateCurrentPassword() {
  const currentPassword = currentPasswordInput.value;

  if (currentPassword === "") {
    showHelper(0, "기존 비밀번호를 입력해주세요.");
    return false;
  }

  hideHelper(0);
  return true;
}

// 새 비밀번호 입력 여부, 형식, + 기존 비밀번호와 동일한지 검사
function validateNewPassword() {
  const newPassword = newPasswordInput.value;

  if (newPassword === "") {
    showHelper(1, "새 비밀번호를 입력해주세요.");
    return false;
  }

  if (!isValidPassword(newPassword)) {
    showHelper(1, "비밀번호는 8~20자, 영문/숫자/특수문자를 포함해야 합니다.");
    return false;
  }

  if (currentPasswordInput.value !== "" && currentPasswordInput.value === newPassword) {
    showHelper(1, "기존 비밀번호와 다른 비밀번호를 입력해주세요.");
    return false;
  }

  hideHelper(1);
  return true;
}

// 새 비밀번호 한번더 입력 여부와 일치 여부 검사
function validatePasswordCheck() {
  const newPassword = newPasswordInput.value;
  const newPasswordCheck = newPasswordCheckInput.value;

  if (newPasswordCheck === "") {
    showHelper(2, "새 비밀번호를 한번 더 입력해주세요.");
    return false;
  }

  if (newPassword !== newPasswordCheck) {
    showHelper(2, "새 비밀번호가 일치하지 않습니다.");
    return false;
  }

  hideHelper(2);
  return true;
}

// 비밀번호 수정 전체 확인
function validatePasswordForm() {
  return (
    validateCurrentPassword() &&validateNewPassword() && validatePasswordCheck());
}

// 이벤트 처리
// 입력들..
currentPasswordInput.addEventListener("input", function () {
  validateCurrentPassword();


  if (newPasswordInput.value !== "") {
    validateNewPassword();
  }
});

newPasswordInput.addEventListener("input", function () {
  validateNewPassword();

  if (newPasswordCheckInput.value !== "") {
    validatePasswordCheck();
  }
});

newPasswordCheckInput.addEventListener("input", validatePasswordCheck);

// 비밀번호 수정 폼 제출 이벤트 처리
passwordForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  // 입력값 최종 확인 -> parch 보내기
  if (!validatePasswordForm()) {
    return;
  }

  try {
    await AppCommon.request("/users/me/password", {
      method: "PATCH",
      auth: true,
      body: {
        originalPwd: currentPasswordInput.value,
        newPwd: newPasswordInput.value,
        oneMoreNewPwd: newPasswordCheckInput.value,
      }
    });

    // 비밀번호 변경 성공 -> 토스트 보여주기
    toast.style.display = "flex";

    setTimeout(function () {
      toast.style.display = "none";
      localStorage.clear();
      window.location.href = "./login.html";
    }, 1500);
  } catch (error) {
    console.error(error);
    if (error.status === 401) showHelper(0, "기존 비밀번호가 일치하지 않습니다.");
    else if (error.status === 400) showHelper(2, "새 비밀번호를 다시 확인해주세요.");
    else if (error.status === 403) showHelper(0, "비밀번호 수정 권한이 없습니다.");
    else if (error.status === 404) showHelper(0, "사용자를 찾을 수 없습니다.");
    else showHelper(0, "비밀번호 수정에 실패했거나 서버와 연결할 수 없습니다.");
  }
});

AppCommon.setupProfileMenu({ profileButton, dropdown, logoutButton });
