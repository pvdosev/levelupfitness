// Simple Login Script
const loginBtn = document.getElementById("loginBtn");
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginError = document.getElementById("loginError");

if(loginBtn && loginScreen && dashboard && loginError) {
    loginBtn.addEventListener("click", () => {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        if (username === "admin" && password === "1234") {
            loginScreen.classList.add("hidden");
            dashboard.classList.remove("hidden");
        } else {
            loginError.textContent = "Invalid username or password";
        }
    });
}

// Dropdown Menu Script
const btn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
if(btn && menu) {
    btn.addEventListener("click", () => {
    menu.classList.toggle("open");
});
}