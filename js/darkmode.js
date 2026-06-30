(function () {
    var KEY = 'darkMode';
    var root = document.documentElement; // <html> — luôn tồn tại khi script chạy

    function applyDark(on) {
        root.classList.toggle('dark', on);
        var btn = document.getElementById('dark-mode-btn');
        if (btn) btn.textContent = on ? '☀️' : '🌙';
    }

    function toggle() {
        var next = !root.classList.contains('dark');
        localStorage.setItem(KEY, next ? '1' : '0');
        applyDark(next);
    }

    // Áp dụng ngay (trước khi DOM vẽ xong) để không bị flash trắng
    if (localStorage.getItem(KEY) === '1') {
        root.classList.add('dark');
    }

    // Gắn nút sau khi DOM sẵn sàng
    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('dark-mode-btn');
        if (btn) {
            btn.textContent = root.classList.contains('dark') ? '☀️' : '🌙';
            btn.addEventListener('click', toggle);
        }
    });
})();
