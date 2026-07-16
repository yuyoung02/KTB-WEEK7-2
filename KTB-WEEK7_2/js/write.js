const API_BASE_URL = "http://localhost:8080";
const DEFAULT_PROFILE_IMAGE = "./assets/images/defaultProfileImage.png";

const writeForm = document.querySelector(".write-form");
const titleInput = document.querySelector("#title");
const contentTextarea = document.querySelector("#content");
const imageInput = document.querySelector("#image");
const fileName = document.querySelector(".file-name");
const helperText = document.querySelector(".helper-text");

const profileButton = document.querySelector("#profileButton");
const dropdown = document.querySelector(".dropdown");
const logoutButton = document.querySelector(".dropdown li:last-child a");

const stadiumButton = document.querySelector("#stadiumButton");
const stadiumDropdown = document.querySelector("#stadiumDropdown");
const stadiumItems = stadiumDropdown?.querySelectorAll(".stadium-option") ?? [];
const selectedStadiumBox = document.querySelector("#selectedStadium");

const accessToken = localStorage.getItem("accessToken");

let selectedStadium = "";
let postImageUrl = null;

function getProfileImage(image) {
  return image || DEFAULT_PROFILE_IMAGE;
}

function showHelper(message) {
  helperText.textContent = `* ${message}`;
  helperText.style.display = "block";
}

function hideHelper() {
  helperText.textContent = "";
  helperText.style.display = "none";
}

if (stadiumButton && stadiumDropdown) {
  stadiumButton.addEventListener("click", function (event) {
    event.stopPropagation();
    stadiumDropdown.classList.toggle("hidden");
  });

  stadiumItems.forEach(function (item) {
    item.addEventListener("click", function (event) {
      event.stopPropagation();

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
        <span>${optionName.textContent}</span>
      `;

      stadiumDropdown.classList.add("hidden");
    });
  });
}

function validateWriteForm() {
  if (!selectedStadium) {
    showHelper("구장을 선택해주세요.");
    return false;
  }

  if (titleInput.value.trim() === "") {
    showHelper("제목을 입력해주세요.");
    return false;
  }

  if (contentTextarea.value.trim() === "") {
    showHelper("내용을 입력해주세요.");
    return false;
  }

  hideHelper();
  return true;
}

async function loadLoginUserProfile() {
  if (!accessToken) return;

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) return;

    const user = await response.json();
    profileButton.src = getProfileImage(user.image);
  } catch (error) {
    console.error(error);
  }
}

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];

  if (!file) {
    fileName.textContent = "파일을 선택해주세요.";
    postImageUrl = null;
    return;
  }

  fileName.textContent = file.name;
  postImageUrl = URL.createObjectURL(file);
});

writeForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!validateWriteForm()) return;

  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        subject: titleInput.value.trim(),
        text: contentTextarea.value.trim(),
        stadium: selectedStadium,
        image: null
      })
    });

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

profileButton.addEventListener("click", function (event) {
  event.stopPropagation();
  dropdown.classList.toggle("hidden");
});

document.addEventListener("click", function (event) {
  dropdown.classList.add("hidden");

  if (!event.target.closest(".stadium-select")) {
    stadiumDropdown?.classList.add("hidden");
  }
});

logoutButton.addEventListener("click", function (event) {
  event.preventDefault();
  localStorage.clear();
  window.location.href = "./login.html";
});

loadLoginUserProfile();