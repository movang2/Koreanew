function saveState() {
    const state = {
        history, ttsSpeed, ttsLanguage, ttsVolume,
        instantLookupEnabled, naverLookupEnabled,
        subtitleOffset, vocabDisplayMode
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube_state_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert("Đã lưu trạng thái!");
}

function loadState() {
    const fileInput = document.getElementById("state-file").files[0];
    if (!fileInput) { alert("Vui lòng chọn file JSON để tải!"); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const state = JSON.parse(event.target.result);
            history = state.history || [];
            ttsSpeed = state.ttsSpeed || 1.5;
            ttsLanguage = state.ttsLanguage || "vi-VN";
            ttsVolume = state.ttsVolume || 1.0;
            instantLookupEnabled = state.instantLookupEnabled ?? true;
            naverLookupEnabled = state.naverLookupEnabled ?? false;
            subtitleOffset = state.subtitleOffset ?? 0;
            vocabDisplayMode = state.vocabDisplayMode ?? false;

            localStorage.setItem("videoHistory", JSON.stringify(history));
            localStorage.setItem("ttsSpeed", ttsSpeed);
            localStorage.setItem("ttsLanguage", ttsLanguage);
            localStorage.setItem("ttsVolume", ttsVolume);
            localStorage.setItem("instantLookup", instantLookupEnabled ? "1" : "0");
            localStorage.setItem("naverLookup", naverLookupEnabled ? "1" : "0");
            localStorage.setItem("subtitleOffset", subtitleOffset);
            localStorage.setItem("vocabDisplayMode", vocabDisplayMode);

            document.getElementById("tts-speed").value = ttsSpeed;
            document.getElementById("speed-value").textContent = ttsSpeed;
            document.getElementById("tts-language").value = ttsLanguage;
            document.getElementById("tts-volume").value = ttsVolume;
            document.getElementById("video-volume").value = ttsVolume * 100;
            document.getElementById("video-volume-value").textContent = ttsVolume * 100;
            document.getElementById("instant-lookup-toggle").checked = instantLookupEnabled;
            document.getElementById("naver-lookup-toggle").checked = naverLookupEnabled;
            document.getElementById("subtitle-offset").value = subtitleOffset;
            document.getElementById("offset-value").textContent = subtitleOffset.toFixed(1);
            document.getElementById("vocab-display-mode").checked = vocabDisplayMode;

            displayHistory();
            alert("Đã tải trạng thái thành công!");
        } catch (e) {
            console.error("Lỗi khi đọc file JSON:", e);
            alert("File không hợp lệ!");
        }
    };
    reader.readAsText(fileInput);
}

function loadInitialState() {
    try {
        history = JSON.parse(localStorage.getItem("videoHistory")) || [];
        ttsSpeed = parseFloat(localStorage.getItem("ttsSpeed")) || 1.5;
        ttsLanguage = localStorage.getItem("ttsLanguage") || "vi-VN";
        ttsVolume = parseFloat(localStorage.getItem("ttsVolume")) || 1.0;
        instantLookupEnabled = localStorage.getItem("instantLookup") !== "0";
        naverLookupEnabled = localStorage.getItem("naverLookup") === "1";
        subtitleOffset = parseFloat(localStorage.getItem("subtitleOffset")) || 0;
        vocabDisplayMode = localStorage.getItem("vocabDisplayMode") === "true";
        vocabPauseTTSEnabled = localStorage.getItem("vocabPauseTTSEnabled") === "1";

        const vpBtn = document.getElementById("vocab-pause-tts-btn");
        if (vpBtn) {
            vpBtn.textContent = vocabPauseTTSEnabled ? "📖 Đọc từ vựng (Bật)" : "📖 Đọc từ vựng (Tắt)";
            if (vocabPauseTTSEnabled) vpBtn.style.backgroundColor = "#6a1b9a";
        }

        document.getElementById("tts-speed").value = ttsSpeed;
        document.getElementById("speed-value").textContent = ttsSpeed;
        document.getElementById("tts-language").value = ttsLanguage;
        document.getElementById("tts-volume").value = ttsVolume;
        document.getElementById("video-volume").value = ttsVolume * 100;
        document.getElementById("video-volume-value").textContent = ttsVolume * 100;
        document.getElementById("instant-lookup-toggle").checked = instantLookupEnabled;
        document.getElementById("naver-lookup-toggle").checked = naverLookupEnabled;
        document.getElementById("subtitle-offset").value = subtitleOffset;
        document.getElementById("offset-value").textContent = subtitleOffset.toFixed(1);
        document.getElementById("vocab-display-mode").checked = vocabDisplayMode;

        displayHistory();
    } catch (e) {
        console.error("Lỗi khi tải trạng thái:", e);
    }
}

function resetToDefault() {
    if (confirm('⚠️ Bạn có chắc muốn reset toàn bộ dữ liệu về trạng thái ban đầu? Hành động này không thể hoàn tác!')) {
        document.querySelectorAll('input, textarea, select').forEach(element => {
            if (['text', 'textarea', 'email', 'password', 'number', 'search', 'tel', 'url'].includes(element.type)) element.value = '';
            else if (['checkbox', 'radio'].includes(element.type)) element.checked = false;
            else if (element.tagName === 'SELECT') element.selectedIndex = 0;
        });
        localStorage.clear();
        sessionStorage.clear();
        document.querySelectorAll('form').forEach(form => form.reset());
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        document.querySelectorAll('[contenteditable="true"]').forEach(el => el.innerHTML = '');
        document.querySelectorAll('input[type="range"]').forEach(el => el.value = el.defaultValue);
        document.querySelectorAll('input[type="radio"]').forEach(radio => { radio.checked = !!radio.defaultChecked; });
        alert('✅ Đã reset toàn bộ dữ liệu thành công!');
    }
}
