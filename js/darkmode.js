(function () {
    const KEY = "darkMode";

    function applyDark(on) {
        document.body.classList.toggle("dark", on);

        const btn = document.getElementById("dark-mode-btn");
        if (btn) {
            btn.textContent = on ? "☀️" : "🌙";
        }
    }

    function toggle() {
        const next = !document.body.classList.contains("dark");
        localStorage.setItem(KEY, next ? "1" : "0");
        applyDark(next);
    }

    document.addEventListener("DOMContentLoaded", function () {

        // Khôi phục trạng thái
        applyDark(localStorage.getItem(KEY) === "1");

        // Gắn nút
        const btn = document.getElementById("dark-mode-btn");
        if (btn) {
            btn.addEventListener("click", toggle);
        }

    });

})();
