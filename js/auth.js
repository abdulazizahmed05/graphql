import { isJWTExpired, showError } from "./utils.js";

if (!isJWTExpired()) {
  window.location.href = "profile.html";
}

const usernameEmailInput = document.getElementById("username-email");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("error");
const endpoint = "https://learn.reboot01.com/api/auth/signin";
const loginForm = document.getElementById("login-form");
const loginContainer = document.querySelector(".login-container");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  login();
});

// get values and validate
async function login() {
  const usernameEmail = usernameEmailInput.value.trim();
  const password = passwordInput.value;
  errorMessage.textContent = "";
  // send post request using base64 encoding for credentials
  const encodedCredentials = btoa(`${usernameEmail}:${password}`);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
      },
    });
    if (!res.ok) {
      showError(errorMessage, "THY NAME OR SECRET IS FALSE");
      loginContainer.classList.add("shake");
      usernameEmailInput.classList.add("shake");
      passwordInput.classList.add("shake");
      loginContainer.addEventListener(
        "animationend",
        () => {
          loginContainer.classList.remove("shake");
          usernameEmailInput.classList.remove("shake");
          passwordInput.classList.remove("shake");
        },
        { once: true },
      );
      return;
    }
    // set token in storage and route to profile
    const token = await res.json();
    localStorage.setItem("token", token);
    window.location.href = "profile.html";
  } catch (err) {
    console.error("Login failed:", err);
    showError(errorMessage, "THE FATE OF THIS REQUEST IS UNCLEAR. TRY AGAIN");
  }
}
