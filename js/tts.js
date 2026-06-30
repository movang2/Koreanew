function readText(text, callback) {
    if (!text) { callback?.(); return; }
    try {
        if (typeof speechSynthesis === 'undefined' || !speechSynthesis) {
            console.error("Trình duyệt không hỗ trợ Web Speech API");
            alert("Trình duyệt của bạn không hỗ trợ chức năng đọc văn bản (TTS).");
            callback?.(); return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = ttsLanguage;
        utterance.rate = ttsSpeed;
        utterance.volume = ttsVolume;
        const voices = speechSynthesis.getVoices();
        if (!voices || voices.length === 0) {
            console.error("Không tìm thấy giọng đọc nào");
            alert("Không tìm thấy giọng đọc phù hợp. Vui lòng kiểm tra cài đặt ngôn ngữ trên thiết bị.");
            callback?.(); return;
        }
        const preferredVoice = voices.find(voice => voice.lang === ttsLanguage);
        if (preferredVoice) utterance.voice = preferredVoice;
        else console.warn("Không tìm thấy giọng đọc phù hợp với ngôn ngữ", ttsLanguage);
        utterance.onend = () => { callback?.(); };
        utterance.onerror = (event) => { console.error("Lỗi TTS:", event); callback?.(); };
        speechSynthesis.speak(utterance);
    } catch (error) {
        console.error("Lỗi khi đọc văn bản:", error);
        callback?.();
    }
}

function removeBracketsContent(text) {
    return text.replace(/\[[^\]]*\]/g, '').trim();
}

function readTextDual(text, callback) {
    const cleanedText = removeBracketsContent(text);
    const parts = cleanedText.split("-");
    const koreanPart = parts[0] ? parts[0].trim() : "";
    const vietnamesePart = parts[1] ? parts[1].trim() : "";
    if (koreanPart) {
        const koUtterance = new SpeechSynthesisUtterance(koreanPart);
        koUtterance.lang = "ko-KR";
        koUtterance.rate = ttsSpeed;
        koUtterance.volume = ttsVolume;
        koUtterance.onend = () => {
            if (vietnamesePart) {
                const viUtterance = new SpeechSynthesisUtterance(vietnamesePart);
                viUtterance.lang = "vi-VN";
                viUtterance.rate = ttsSpeed;
                viUtterance.volume = ttsVolume;
                viUtterance.onend = callback;
                speechSynthesis.speak(viUtterance);
            } else if (callback) callback();
        };
        speechSynthesis.speak(koUtterance);
    } else if (vietnamesePart) {
        const viUtterance = new SpeechSynthesisUtterance(vietnamesePart);
        viUtterance.lang = "vi-VN";
        viUtterance.rate = ttsSpeed;
        viUtterance.volume = ttsVolume;
        viUtterance.onend = callback;
        speechSynthesis.speak(viUtterance);
    } else if (callback) callback();
}

function testTTS() {
    readText("Kiểm tra giọng đọc", () => {});
}

function updateTTSSpeed(value) {
    ttsSpeed = parseFloat(value);
    document.getElementById("speed-value").textContent = ttsSpeed;
    localStorage.setItem("ttsSpeed", ttsSpeed);
}

function updateTTSLanguage(language) {
    ttsLanguage = language;
    localStorage.setItem("ttsLanguage", ttsLanguage);
}

function updateTTSVolume(value) {
    ttsVolume = parseFloat(value);
    document.getElementById("tts-volume-value").textContent = ttsVolume.toFixed(1);
    localStorage.setItem("ttsVolume", ttsVolume);
}

function triggerVocabPauseTTS(vocab) {
    if (!youtubePlayer || !vocab) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    isVocabPauseSpeaking = true;
    try { youtubePlayer.pauseVideo(); } catch (e) {}
    const koreanWord = removeBracketsContent((vocab.word || "").trim());
    const vietnameseMeaning = removeBracketsContent((vocab.meaning || "").trim());
    const speakKorean = () => new Promise((resolve) => {
        if (!koreanWord) return resolve();
        const u = new SpeechSynthesisUtterance(koreanWord);
        u.lang = "ko-KR"; u.rate = ttsSpeed; u.volume = ttsVolume;
        const voices = speechSynthesis.getVoices();
        const ko = voices.find(v => v.lang === "ko-KR") || voices.find(v => v.lang && v.lang.startsWith("ko"));
        if (ko) u.voice = ko;
        u.onend = () => resolve(); u.onerror = () => resolve();
        speechSynthesis.speak(u);
    });
    const speakVietnamese = () => new Promise((resolve) => {
        if (!vietnameseMeaning) return resolve();
        const u = new SpeechSynthesisUtterance(vietnameseMeaning);
        u.lang = "vi-VN"; u.rate = ttsSpeed; u.volume = ttsVolume;
        const voices = speechSynthesis.getVoices();
        const vi = voices.find(v => v.lang === "vi-VN") || voices.find(v => v.lang && v.lang.startsWith("vi"));
        if (vi) u.voice = vi;
        u.onend = () => resolve(); u.onerror = () => resolve();
        speechSynthesis.speak(u);
    });
    speakKorean().then(() => speakVietnamese()).finally(() => {
        isVocabPauseSpeaking = false;
        if (vocabPauseTTSEnabled && youtubePlayer) {
            try { youtubePlayer.playVideo(); } catch (e) {}
        }
    });
}

function toggleVocabPauseTTS() {
    vocabPauseTTSEnabled = !vocabPauseTTSEnabled;
    lastVocabPauseIndex = -1;
    const btn = document.getElementById("vocab-pause-tts-btn");
    if (btn) {
        btn.textContent = vocabPauseTTSEnabled ? "📖 Đọc từ vựng (Bật)" : "📖 Đọc từ vựng (Tắt)";
        btn.style.backgroundColor = vocabPauseTTSEnabled ? "#6a1b9a" : "";
    }
    try { localStorage.setItem("vocabPauseTTSEnabled", vocabPauseTTSEnabled ? "1" : "0"); } catch (e) {}
}

function toggleVocabTTSMode() {
    vocabTTSMode = !vocabTTSMode;
    const button = document.getElementById("vocab-tts-toggle");
    button.textContent = `Chế độ đọc từ vựng (${vocabTTSMode ? "Bật" : "Tắt"})`;
    const startBtn = document.getElementById("start-vocab-tts");
    const pauseBtn = document.getElementById("pause-vocab-tts");
    const stopBtn = document.getElementById("stop-vocab-tts");
    startBtn.disabled = !vocabTTSMode;
    pauseBtn.disabled = !vocabTTSMode;
    stopBtn.disabled = !vocabTTSMode;
    if (!vocabTTSMode) stopVocabTTS();
}

function startVocabTTS() {
    if (!vocabTTSMode) return;
    const container = document.getElementById("linked-vocab-list");
    const items = Array.from(container.querySelectorAll(".clickable-vocab"));
    if (items.length === 0) { alert("Không có từ vựng để đọc! Hãy nhấn 'Liên kết từ vựng với phụ đề' trước."); return; }
    const vocabItems = items.map(div => {
        const parts = div.textContent.split("-");
        return { korean: parts[0]?.trim() || "", vietnamese: parts.slice(1).join("-").trim() || "" };
    }).filter(item => item.korean);
    if (vocabItems.length === 0) { alert("Không tìm thấy từ vựng hợp lệ!"); return; }
    isVocabTTSPaused = false;
    vocabTTSIndex = pausedVocabIndex >= 0 ? pausedVocabIndex : 0;
    pausedVocabIndex = -1;
    readVocabItem(vocabItems);
}

function readVocabItem(vocabItems) {
    if (vocabTTSIndex >= vocabItems.length || isVocabTTSPaused) return;
    const item = vocabItems[vocabTTSIndex];
    highlightCurrentVocabItem(vocabTTSIndex);
    const textToRead = `${item.korean} - ${item.vietnamese}`;
    readTextDual(textToRead, () => {
        vocabTTSIndex++;
        if (vocabTTSIndex < vocabItems.length && !isVocabTTSPaused) {
            vocabTTSTimeout = setTimeout(() => readVocabItem(vocabItems), 500);
        }
    });
}

function highlightCurrentVocabItem(index) {
    const container = document.getElementById("linked-vocab-list");
    const items = container.querySelectorAll(".clickable-vocab");
    items.forEach((item, i) => { item.style.backgroundColor = i === index ? "#d0e8ff" : ""; });
}

function pauseVocabTTS() {
    if (!vocabTTSMode || vocabTTSIndex === -1) return;
    isVocabTTSPaused = !isVocabTTSPaused;
    document.getElementById("pause-vocab-tts").textContent = isVocabTTSPaused ? "Tiếp tục" : "Tạm dừng";
    if (isVocabTTSPaused) { pausedVocabIndex = vocabTTSIndex; speechSynthesis.cancel(); clearTimeout(vocabTTSTimeout); }
    else startVocabTTS();
}

function stopVocabTTS() {
    isVocabTTSPaused = false; vocabTTSIndex = -1; pausedVocabIndex = -1;
    speechSynthesis.cancel(); clearTimeout(vocabTTSTimeout);
    highlightCurrentVocabItem(-1);
}
