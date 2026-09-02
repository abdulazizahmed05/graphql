const endpoint = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";
let errorTimeout;

// fetching helper
export async function fetchData(query) {
  const JWT = localStorage.getItem("token");
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
      }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Fetch failed:", err);
    return;
  }
}

// formatting bytes helper
export function formatBytes(bytes) {
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "kB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1000));
  const value = bytes / Math.pow(1000, index);
  const truncatedValue = Math.floor(value * 100) / 100;
  return `${truncatedValue.toFixed(2)} ${units[index]}`;
}

// logout helper
export function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

// token expiry helper
export function isJWTExpired() {
  const token = localStorage.getItem("token");
  if (!token) {
    return true;
  }
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return currentTime >= payload.exp;
  } catch (err) {
    return true;
  }
}

// error timeout helper
export function showError(errorMessage, message) {
  clearTimeout(errorTimeout);
  errorMessage.textContent = message;
  errorTimeout = setTimeout(() => {
    errorMessage.textContent = "";
  }, 5000);
}
