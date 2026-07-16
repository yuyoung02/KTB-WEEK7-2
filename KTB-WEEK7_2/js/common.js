(function () {
  const API_BASE_URL = "http://localhost:8080";
  const DEFAULT_PROFILE_IMAGE = "./assets/images/defaultProfileImage.png";

  class ApiError extends Error {
    constructor(message, response, data = null) {
      super(message);
      this.name = "ApiError";
      this.status = response.status;
      this.data = data;
    }
  }

  function getAccessToken() {
    return localStorage.getItem("accessToken");
  }

  function getProfileImage(image) {
    return image || DEFAULT_PROFILE_IMAGE;
  }

  function requireAuth(options = {}) {
    if (getAccessToken()) return true;

    const message = options.message ?? "로그인이 필요합니다.";
    const redirectUrl = options.redirectUrl ?? "./login.html";

    if (options.showAlert !== false) alert(message);
    window.location.href = redirectUrl;
    return false;
  }

  async function request(path, options = {}) {
    const { auth = false, headers = {}, ...fetchOptions } = options;
    const requestHeaders = new Headers(headers);

    if (auth) {
      const accessToken = getAccessToken();
      if (accessToken) requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    if (fetchOptions.body && typeof fetchOptions.body !== "string") {
      requestHeaders.set("Content-Type", "application/json");
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: requestHeaders
    });
    const contentType = response.headers.get("content-type") ?? "";
    const data = response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
      throw new ApiError(`API 요청 실패 (${response.status})`, response, data);
    }

    return data;
  }

  async function fetchCurrentUser() {
    if (!getAccessToken()) return null;

    try {
      return await request("/users/me", { auth: true });
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function formatDate(dateString, options = {}) {
    if (!dateString) return "";

    const normalized = dateString.replace("T", " ");
    if (options.dateOnly) return normalized.slice(0, 10).replaceAll("-", ".");
    return normalized.slice(0, options.withSeconds ? 19 : 16);
  }

  function setHelperText(element, message = "") {
    if (!element) return;
    element.textContent = message ? `* ${message}` : "";
    element.style.display = message ? "block" : "none";
  }

  async function loadProfileImage(profileButton) {
    if (!profileButton) return null;

    const user = await fetchCurrentUser();
    if (user) profileButton.src = getProfileImage(user.image);
    return user;
  }

  function logout(redirectUrl = "./login.html") {
    localStorage.clear();
    window.location.href = redirectUrl;
  }

  function setupProfileMenu(options = {}) {
    const profileButton = options.profileButton ?? document.querySelector("#profileButton");
    const dropdown = options.dropdown ?? document.querySelector(".dropdown");
    const logoutButton = options.logoutButton ?? document.querySelector("#logoutButton");

    if (!profileButton || !dropdown) return;

    profileButton.addEventListener("click", function (event) {
      event.stopPropagation();
      dropdown.classList.toggle("hidden");
    });

    dropdown.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    document.addEventListener("click", function () {
      dropdown.classList.add("hidden");
    });

    logoutButton?.addEventListener("click", function (event) {
      event.preventDefault();
      logout(options.loginUrl);
    });
  }

  window.AppCommon = {
    API_BASE_URL,
    ApiError,
    DEFAULT_PROFILE_IMAGE,
    fetchCurrentUser,
    formatDate,
    getAccessToken,
    getProfileImage,
    loadProfileImage,
    logout,
    request,
    requireAuth,
    setHelperText,
    setupProfileMenu
  };
})();
