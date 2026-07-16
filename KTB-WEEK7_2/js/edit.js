const API_BASE_URL = "http://localhost:8080";
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

const stadiumButton = document.querySelector("#stadiumButton");
const stadiumDropdown = document.querySelector("#stadiumDropdown");
const stadiumItems = stadiumDropdown?.querySelectorAll(".stadium-option") ?? [];
const selectedStadiumBox = document.querySelector("#selectedStadium");

const accessToken = localStorage.getItem("accessToken");
const params = new URLSearchParams(window.location.search);
const postId = params.get("postId");

let loginUser = null;
let selectedStadium = "";
let patchImageUrl = null;

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

async function fetchUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function loadLoginUserProfile() {
  const user = await fetchUser();

  if (!user) return;

  loginUser = user;
  profileButton.src = getProfileImage(user.image);
}

function setSelectedStadium(item) {
  selectedStadium = item.dataset.value;

  const logoWrap = item.querySelector(".option-logo-wrap");
  const optionName = item.querySelector(".option-name");

  selectedStadiumBox.innerHTML = `
    <span class="option-logo-wrap ${logoWrap.classList.contains("double") ? "double" : "single"}">
      ${logoWrap.innerHTML}
    </span>
    <span>${optionName.textContent}</span>
  `;

  stadiumItems.forEach(function (stadiumItem) {
    stadiumItem.classList.remove("active");
  });

  item.classList.add("active");
}

if (stadiumButton && stadiumDropdown) {
  stadiumButton.addEventListener("click", function (event) {
    event.stopPropagation();
    stadiumDropdown.classList.toggle("hidden");
  });

  stadiumItems.forEach(function (item) {
    item.addEventListener("click", function (event) {
      event.stopPropagation();
      setSelectedStadium(item);
      stadiumDropdown.classList.add("hidden");
    });
  });
}

async function loadPostDetail() {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      alert("게시글을 불러오지 못했습니다.");
      return;
    }

    const post = await response.json();

    if (loginUser && loginUser.userId !== post.userId) {
      alert("게시글 작성자만 수정할 수 있습니다.");
      window.location.href = `./postDetails.html?postId=${postId}`;
      return;
    }

    titleInput.value = post.subject;
    contentTextarea.value = post.text;

    if (post.stadium && stadiumItems.length) {
      const item = [...stadiumItems].find(
        (stadiumItem) => stadiumItem.dataset.value === post.stadium
      );

      if (item) {
        setSelectedStadium(item);
      }
    }

    if (post.image) {
      fileName.textContent = "기존 이미지 있음";
      patchImageUrl = post.image;
    } else {
      fileName.textContent = "파일을 선택해주세요.";
      patchImageUrl = null;
    }
  } catch (error) {
    console.error(error);
  }
}

function validateEditForm() {
  if (contentTextarea.value.trim() === "") {
    showHelper("내용을 입력해주세요.");
    return false;
  }

  hideHelper();
  return true;
}

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];

  if (!file) return;

  fileName.textContent = file.name;
  patchImageUrl = URL.createObjectURL(file);
});

editForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!validateEditForm()) return;

  const body = {
    patchSubject: titleInput.value.trim(),
    patchText: contentTextarea.value.trim(),
    patchImage: patchImageUrl
  };

  if (selectedStadium) {
    body.patchStadium = selectedStadium;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });

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

backButton.href = `./postDetails.html?postId=${postId}`;

profileButton.addEventListener("click", function (event) {
  event.stopPropagation();
  dropdown.classList.toggle("hidden");
});

document.addEventListener("click", function (event) {
  dropdown.classList.add("hidden");
  stadiumDropdown?.classList.add("hidden");
});

logoutButton.addEventListener("click", function (event) {
  event.preventDefault();
  localStorage.clear();
  window.location.href = "./login.html";
});

async function init() {
  await loadLoginUserProfile();
  await loadPostDetail();
}

init();