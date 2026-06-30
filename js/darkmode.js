(function () {
    const KEY = 'darkMode';

    function applyDark(on) {
        document.body.classList.toggle('dark', on);
        const btn = document.getElementById('dark-mode-btn');
        if (btn) btn.textContent = on ? '☀️' : '🌙';
    }

    function toggle() {
        const next = !document.body.classList.contains('dark');
        localStorage.setItem(KEY, next ? '1' : '0');
        applyDark(next);
    }

    /* Áp dụng ngay khi script load (trước khi DOM render xong cũng được) */
    const saved = localStorage.getItem(KEY);
    if (saved === '1') applyDark(true);

    /* Gắn sự kiện sau khi DOM sẵn sàng */
    document.addEventListener('DOMContentLoaded', function () {
        const btn = document.getElementById('dark-mode-btn');
        if (btn) {
            btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
            btn.addEventListener('click', toggle);
        }
    });
})();
