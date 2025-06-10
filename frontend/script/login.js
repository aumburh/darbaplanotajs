/*
  Author: Rainers
  Last Modified By: Rainers
  Last Modified: 2025-05-25
*/

function showLogin() {
  document.getElementById("login-container").style.display = "flex";
  document.getElementById("register-container").style.display = "none";
  document.getElementById("login-error").style.display = "none";
  document.getElementById("register-error").style.display = "none";
}
function showRegister() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("register-container").style.display = "flex";
  document.getElementById("login-error").style.display = "none";
  document.getElementById("register-error").style.display = "none";
}
document.getElementById("show-register").onclick = function (e) {
  e.preventDefault();
  showRegister();
};
document.getElementById("show-login").onclick = function (e) {
  e.preventDefault();
  showLogin();
};

// Handle login and registration forms
document
  .getElementById("login-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const identifier = document.getElementById("login-identifier").value.trim();
    const password = document.getElementById("login-password").value;
    const err = document.getElementById("login-error");
    err.style.display = "none";
    if (!identifier || !password) {
      err.textContent = "Lūdzu, aizpildiet visus laukus.";
      err.style.display = "block";
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/";
      } else {
        err.textContent =
          data.message || "Nepareizs e-pasts/lietotājvārds vai parole.";
        err.style.display = "block";
      }
    } catch {
      err.textContent = "Servera kļūda.";
      err.style.display = "block";
    }
  });

document
  .getElementById("register-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("reg-email").value.trim();
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    const password2 = document.getElementById("reg-password2").value;
    const err = document.getElementById("register-error");
    err.style.display = "none";
    if (!email || !username || !password || !password2) {
      err.textContent = "Lūdzu, aizpildiet visus laukus.";
      err.style.display = "block";
      return;
    }
    if (password !== password2) {
      err.textContent = "Paroles nesakrīt.";
      err.style.display = "block";
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Reģistrācija veiksmīga! Tagad pieslēdzieties.");
        showLogin();
      } else {
        err.textContent = data.message || "Reģistrācija neizdevās.";
        err.style.display = "block";
      }
    } catch {
      err.textContent = "Servera kļūda.";
      err.style.display = "block";
    }
  });

showLogin();
