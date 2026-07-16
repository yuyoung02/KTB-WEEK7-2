// HTML 태그들
const loginForm = document.querySelector(".login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const helperText = document.querySelector(".helper-text");

// helper text
function showError(message) {
  AppCommon.setHelperText(helperText, message);
}

function hideError() {
  AppCommon.setHelperText(helperText);
}

//이메일 형식 검사
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 로그인 입력값 검증
function validateLoginForm() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (email === "") {
    showError("이메일을 입력해주세요.");
    return false;
  }

  if (!isValidEmail(email)) {
    showError("올바른 이메일 형식을 입력해주세요.");
    return false;
  }

  // 비번 미입력
  if (password === "") {
    showError("비밀번호를 입력해주세요.");
    return false;
  }

  hideError();
  return true;
}


// 2-1 로그인, 비번 이벤트 처리
emailInput.addEventListener("input", validateLoginForm);
passwordInput.addEventListener("input", validateLoginForm);

// 로그인 버튼 누르면 → 응답 제출
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  // 입력값 최종 확인 후  → 로그인 요청
  if (!validateLoginForm()) {
    return;
  }

  // fetch 보내기
  try {
    const data = await AppCommon.request("/users/login", {
      method: "POST",
      body: {
        email: emailInput.value.trim(),
        password: passwordInput.value
      }
    });

    console.log("로그인 성공:", data);

    // WEEK8: accessToken 반환으로 변경
    localStorage.setItem("accessToken", data.accessToken);

    window.location.href = "./home.html";
  } catch (error) {
    console.error(error);
    if (error.status === 401) {
      showError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else if (error.status === 400) {
      showError("입력값을 다시 확인해주세요.");
    } else {
      showError("로그인에 실패했거나 서버와 연결할 수 없습니다.");
    }
  }
});
