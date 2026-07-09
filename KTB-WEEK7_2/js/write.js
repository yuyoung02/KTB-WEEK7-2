const API_BASE_URL = "http://localhost:8080";

// 게시글 작성 작성 태그
const writeForm = document.querySelector(".write-form");

const titleInput = document.querySelector("#title");
const contentTextarea = document.querySelector("#content");
const imageInput = document.querySelector("#image");
const fileName = document.querySelector(".file-name");

const helperText = document.querySelector(".helper-text");

//프사 관련 태그
const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector(".dropdown li:last-child a");

const accessToken = localStorage.getItem("accessToken");

let postImageUrl = null;

if (!accessToken) {
  alert("로그인이 필요합니다.");
  window.location.href = "./login.html";
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

// 게시글 필수 요소 검증
function validateWriteForm() {
  const title = titleInput.value.trim();
  const content = contentTextarea.value.trim();

  if (title === "") {
    showHelper("제목을 입력해주세요.");
    return false;
  }

  if (title.length > 100) {
    showHelper("제목은 최대 100글자까지 가능합니다.");
    return false;
  }

  if (content === "") {
    showHelper("내용을 입력해주세요.");
    return false;
  }

  hideHelper();
  return true;
}

// TODO: 이미지 구현
function getProfileImage(image) {
  return null;
}

async function loadLoginUserProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`,
      {
        method : "GET",
        headers : {
          "Authorization": `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      return;
    }

    const user = await response.json();
    profileButton.src = getProfileImage(user.image);
  } catch (error) {
    console.error(error);
  }
}

// TODO: 이미지 구현
imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];

  if (!file) {
    fileName.textContent = "파일을 선택해주세요.";
    postImageUrl = null;
    return;
  }

  fileName.textContent = file.name;

  postImageUrl = null;
});

// 게시글 입력 항목들 이벤트 처리
titleInput.addEventListener("input", validateWriteForm);
contentTextarea.addEventListener("input", validateWriteForm);

// 게시글 입력 폼 제출
writeForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  // 최종 확인 -> 제출
  if (!validateWriteForm()) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        subject: titleInput.value.trim(),
        text: contentTextarea.value.trim(),
        // TODO: 이미지 구현
        image: null
      })
    });

    if (response.status === 400) {
      showHelper("제목과 내용을 다시 확인해주세요.");
      return;
    }

    if (response.status === 404) {
      showHelper("로그인한 사용자를 찾을 수 없습니다.");
      return;
    }

    if (!response.ok) {
      showHelper("게시글 작성에 실패했습니다.");
      return;
    }

    window.location.href = "./posts.html";
  } catch (error) {
    console.error(error);
    showHelper("서버와 연결할 수 없습니다.");
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
  window.location.href = "./login.html";
});

loadLoginUserProfile();