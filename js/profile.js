import { drawPassFailPieChart, drawXpProgressionGraph } from "./chart.js";
import {
  formatDate,
  formatBytes,
  fetchData,
  isJWTExpired,
  logout,
} from "./utils.js";

if (isJWTExpired()) {
  logout();
}
// user info
const usernameElement = document.getElementById("nav-username");
const userIdElement = document.getElementById("nav-user-id");
const fullNameElement = document.getElementById("full-name");
const levelElement = document.getElementById("level");
// user details
const userCPR = document.getElementById("details-cpr");
const userGender = document.getElementById("details-gender");
const userDob = document.getElementById("details-birth-date");
const userCob = document.getElementById("details-country");
const userPhone = document.getElementById("details-phone-number");
const userDegree = document.getElementById("details-degree");
const userQualification = document.getElementById("details-qualification");
const userGraduation = document.getElementById("details-graduation-date");
const userOccupation = document.getElementById("details-occupation");
const userJobTitle = document.getElementById("details-job-title");
// user overview
const latestNameElement = document.getElementById("latest-completion-name");
const latestTypeElement = document.getElementById("latest-completion-type");
const latestDateElement = document.getElementById("latest-completion-date");
const auditRatioElement = document.getElementById("audit-ratio");
const auditsDoneElement = document.getElementById("audits-done");
const auditsReceivedElement = document.getElementById("audits-received");
const totalXpElement = document.getElementById("total-xp");
// pass fail data
const passedProjectsElement = document.getElementById("passed-projects");
const failedProjectsElement = document.getElementById("failed-projects");
// buttons
const logoutButton = document.getElementById("logout-button");
const viewDetailsButton = document.getElementById("view-details-button");
const closeDetailsButton = document.getElementById("close-details-button");
const detailsModal = document.getElementById("details-modal");
const audio = document.getElementById("background-audio");
const audioButton = document.getElementById("audio-button");
audio.volume = 0.05;

logoutButton.addEventListener("click", logout);

viewDetailsButton.addEventListener("click", () => {
  detailsModal.hidden = false;
  document.body.classList.add("modal-open");
});

closeDetailsButton.addEventListener("click", () => {
  detailsModal.hidden = true;
  document.body.classList.remove("modal-open");
});

audioButton.addEventListener("click", () => {
  audio.muted = !audio.muted;
  if (audio.muted) {
    audioButton.innerHTML = ` <img class="audio-icon" src="static/assets/mute.png" alt="mute" />`;
  } else {
    audioButton.innerHTML = ` <img class="audio-icon" src="static/assets/volume.png" alt="volume" />`;
  }
});

// get basic user info
async function loadUserInfo() {
  const query = `{
  user {
    id
    login
    firstName
    lastName
    attrs
  }
}`;
  const res = await fetchData(query);
  const userData = res.data.user[0];
  const userAttrs = userData.attrs;
  // user info
  usernameElement.textContent = userData.login;
  userIdElement.textContent = `#${userData.id}`;
  fullNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
  // user details
  userCPR.textContent = userAttrs.CPRnumber;
  userGender.textContent = userAttrs.genders;
  userDob.textContent = formatDate(userAttrs.dateOfBirth.split("T")[0]);
  userCob.textContent = userAttrs.countryOfBirth;
  userPhone.textContent = userAttrs.PhoneNumber;
  userDegree.textContent = userAttrs.Degree;
  userQualification.textContent = userAttrs.qualification;
  userGraduation.textContent = userAttrs.graddate;
  userOccupation.textContent = userAttrs.employment;
  userJobTitle.textContent = userAttrs.jobtitle;
}

// get current level for user
async function loadUserLevel() {
  const query = `{
  transaction(where: {type: {_eq: "level"}}, order_by: {amount: desc}, limit: 1) {
    amount
  }
}`;
  const res = await fetchData(query);
  const level = res.data.transaction[0];
  levelElement.textContent = level.amount;
}

// get user's latest completion
async function loadUserLatestCompletion() {
  const query = `{
  progress(where: {grade: {_gte: 1}}, order_by: {updatedAt: desc}, limit: 1) {
    updatedAt
    object {
      name
      type
    }
  }
}`;
  const res = await fetchData(query);
  const progress = res.data.progress[0];
  latestDateElement.textContent = formatDate(progress.updatedAt.split("T")[0]);
  latestNameElement.textContent = progress.object.name;
  latestTypeElement.textContent = progress.object.type;
}

// get audit ratio + done + received
async function loadUserAuditInfo() {
  const query = `{
  user {
    auditRatio
    totalUp
    totalDown
  }
}`;
  const res = await fetchData(query);
  const user = res.data.user[0];
  auditRatioElement.textContent = user.auditRatio.toFixed(1);
  auditsDoneElement.textContent = formatBytes(user.totalUp);
  auditsReceivedElement.textContent = formatBytes(user.totalDown);
}

// get total xp for user
async function loadUserTotalXp() {
  const query1 = `{
  transaction(where: {type: {_eq: "xp"}, object: {name: {_eq: "go-reloaded"}}}) {
    createdAt
  }
}`;
  const start = await fetchData(query1);
  const goReloadedDate = start.data.transaction[0].createdAt;
  const query2 = `{
  transaction(
    where: {type: {_eq: "xp"}, createdAt: {_gte: "${goReloadedDate}"},
    _or: [{object: {type: {_eq: "project"}}},
    {object: {type: {_eq: "piscine"}}},
    {object: {type: {_eq: "exercise"}}, path: {_ilike: "%/checkpoint/%"}}]}
  ) {
    amount
    createdAt
  }
}`;
  const res = await fetchData(query2);
  const transactions = res.data.transaction;
  const totalXp = transactions.reduce((total, transaction) => {
    return total + transaction.amount;
  }, 0);
  totalXpElement.textContent = formatBytes(totalXp, 0);
}

// get passed + failed projects for chart
async function loadUserProjectInfo() {
  const query = `{
  progress(where: {object: {type: {_eq: "project"}}}) {
    grade
  }
}`;
  const res = await fetchData(query);
  const projects = res.data.progress;
  let passed = 0;
  let failed = 0;
  projects.forEach((project) => {
    if (project.grade === null) {
      return;
    }
    if (project.grade >= 1) {
      passed++;
    } else if (project.grade === 0) {
      failed++;
    }
  });
  passedProjectsElement.textContent = passed;
  failedProjectsElement.textContent = failed;
  drawPassFailPieChart(passed, failed);
}

// get xp amounts and times for xp progress chart
async function loadUserXpProgression() {
  const query1 = `{
  transaction(where: {type: {_eq: "xp"}, object: {name: {_eq: "go-reloaded"}}}) {
    createdAt
  }
}`;
  const start = await fetchData(query1);
  const goReloadedDate = start.data.transaction[0].createdAt;
  const query2 = `{
  transaction(
    where: {type: {_eq: "xp"}, createdAt: {_gte: "${goReloadedDate}"},
    _or: [{object: {type: {_eq: "project"}}},
    {object: {type: {_eq: "piscine"}}},
    {object: {type: {_eq: "exercise"}}, path: {_ilike: "%/checkpoint/%"}}]}
    order_by: {createdAt: asc}
  ) {
    amount
    createdAt
    object {
    type
    name
    }
  }
}`;
  const res = await fetchData(query2);
  const transactions = res.data.transaction;
  let totalXp = 0;
  const progression = transactions.map((transaction) => {
    totalXp += transaction.amount;
    return {
      date: transaction.createdAt.split("T")[0],
      xp: transaction.amount,
      totalXp: totalXp,
      name: transaction.object.name,
      type: transaction.object.type,
    };
  });
  drawXpProgressionGraph(progression);
}

// load entire profile
async function loadUserProfile() {
  try {
    await Promise.all([
      loadUserInfo(),
      loadUserLevel(),
      loadUserLatestCompletion(),
      loadUserTotalXp(),
      loadUserAuditInfo(),
      loadUserProjectInfo(),
      loadUserXpProgression(),
    ]);
  } catch (err) {
    console.error("Profile loading failed:", err);
  }
}

loadUserProfile();
