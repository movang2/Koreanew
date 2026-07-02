async function loadSubtitles() {
    const fileInput = document.getElementById("subtitle-file").files[0];
    if (!fileInput) { alert("Vui lòng chọn file SRT!"); return; }
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            subtitleData = parseSRT(event.target.result);
            window.subtitleData = subtitleData;
            if (!subtitleData || subtitleData.length === 0) { alert("File SRT không hợp lệ hoặc trống!"); return; }
            alert(`Đã tải và xử lý ${subtitleData.length} dòng phụ đề!`);
            displaySubtitleList();
            if (youtubePlayer && youtubePlayer.seekTo) {
                await waitForPlayer();
                youtubePlayer.seekTo(subtitleData[0].startTime, true);
                youtubePlayer.playVideo();
                setTimeout(startReading, 800);
            }
            saveToHistory(currentVideoUrl, event.target.result, document.getElementById("notebooklm-vocab").value);
        } catch (err) {
            console.error("Lỗi xử lý SRT:", err);
            alert("Có lỗi khi xử lý file SRT.");
        }
    };
    reader.readAsText(fileInput);
}

function parseSRT(srtContent) {
    const subtitleBlocks = srtContent.trim().split(/\n\s*\n/);
    return subtitleBlocks.map(block => {
        const lines = block.split("\n");
        if (lines.length < 3) return null;
        const timing = lines[1].split(" --> ");
        const startTimeParts = timing[0].split(/[:,]/);
        const endTimeParts = timing[1].split(/[:,]/);
        const startTime = parseInt(startTimeParts[0]) * 3600 + parseInt(startTimeParts[1]) * 60 + parseFloat(`${startTimeParts[2]}.${startTimeParts[3] || '0'}`);
        const endTime = parseInt(endTimeParts[0]) * 3600 + parseInt(endTimeParts[1]) * 60 + parseFloat(`${endTimeParts[2]}.${endTimeParts[3] || '0'}`);
        if (lines.length === 3) {
            const koreanText = lines[2].trim();
            return { startTime: isNaN(startTime) ? 0 : startTime, endTime: isNaN(endTime) ? startTime + 2 : endTime, fullText: koreanText, koreanText, vietnameseText: "" };
        } else {
            const koreanText = lines[2].trim();
            const vietnameseText = lines[3].trim();
            return { startTime: isNaN(startTime) ? 0 : startTime, endTime: isNaN(endTime) ? startTime + 2 : endTime, fullText: `${koreanText} ${vietnameseText}`, koreanText, vietnameseText };
        }
    }).filter(item => item && typeof item.startTime === 'number' && item.koreanText);
}

function displaySubtitleList() {
    const subtitleList = document.getElementById("subtitle-list");
    subtitleList.innerHTML = "";
    subtitleData.forEach((sub, index) => {
        const div = document.createElement("div");
        div.className = "subtitle-item";
        div.innerHTML = `${formatTime(sub.startTime)}: <span class="korean">${sub.koreanText}</span> <span class="vietnamese">${sub.vietnameseText}</span> <button onclick="addFavoriteToCurrentVideo(${index}); event.stopPropagation();">Yêu thích</button>`;
        div.onclick = () => jumpToSubtitle(index);
        subtitleList.appendChild(div);
    });
}

function jumpToSubtitle(index) {
    if (!youtubePlayer) { alert("Vui lòng tải video trước!"); return; }
    currentSubtitleIndex = index - 1;
    youtubePlayer.seekTo(subtitleData[index].startTime, true);
    youtubePlayer.playVideo();
    highlightSubtitle(index);
}

function highlightSubtitle(index) {
    const items = document.getElementsByClassName("subtitle-item");
    for (let i = 0; i < items.length; i++) items[i].classList.remove("active");
    if (items[index]) items[index].classList.add("active");
}

function updateSubtitleDisplay(index) {
    const startIndex = Math.max(0, index - 2);
    const endIndex = Math.min(subtitleData.length - 1, index + 2);
    let subtitleContent = "";

    // Tất cả từ đã biết nghĩa (Google Dịch + thủ công)
    const knownWords = vocabList
        .filter(v => v.meaning && v.meaning !== "Đang tra cứu...")
        .map(v => v.word);

    // Từ trong NotebookLM
    const notebookWords = document.getElementById("notebooklm-vocab").value
        .split("\n").filter(line => line.trim())
        .map(line => line.split(":")[0]?.trim()).filter(Boolean);

    const allHighlightWords = new Set([...knownWords, ...notebookWords]);

    for (let i = startIndex; i <= endIndex; i++) {
        const sub = subtitleData[i];
        const highlightedKoreanText = sub.koreanText.split(/\s+/).map(word => {
            const cleanWord = word.replace(/[^\p{Script=Hangul}]+/gu, "").trim();
            if (!cleanWord) return word;
            // Highlight nếu từ trong câu chứa bất kỳ từ vựng đã biết
            const matched = [...allHighlightWords].some(vw => vw && cleanWord.includes(vw));
            if (matched) {
                return `<span class="korean-word learned" style="background-color:#ffeb3b;font-weight:bold;border-radius:4px;padding:2px 6px;cursor:pointer;" onclick="handleWordClick('${cleanWord}', ${i})">${word}</span>`;
            }
            return `<span class="korean-word" onclick="handleWordClick('${cleanWord}', ${i})">${word}</span>`;
        }).join(" ");
        const isCurrent = i === index ? "current" : "";
        subtitleContent += `<div class="subtitle-line ${isCurrent}">${formatTime(sub.startTime)}: ${highlightedKoreanText} <span class="vietnamese">${sub.vietnameseText}</span></div>`;
    }
    document.getElementById("subtitle-display").innerHTML = subtitleContent;
    highlightSubtitle(index);
}

function startReading() {
    if (!youtubePlayer || subtitleData.length === 0) { alert("Vui lòng tải video và phụ đề trước!"); return; }
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => { syncSubtitles(); }, 200);
    syncSubtitles();
}

function syncSubtitles() {
    if (!youtubePlayer || youtubePlayer.getPlayerState() !== YT.PlayerState.PLAYING) return;
    const currentTime = youtubePlayer.getCurrentTime() + subtitleOffset;
    let nextSubtitle = null;
    let nextIndex = -1;
    for (let i = 0; i < subtitleData.length; i++) {
        if (subtitleData[i].startTime <= currentTime) { nextSubtitle = subtitleData[i]; nextIndex = i; }
        else break;
    }
    if (nextSubtitle && nextIndex !== currentSubtitleIndex) {
        currentSubtitleIndex = nextIndex;
        updateSubtitleDisplay(currentSubtitleIndex);

        // Tìm tất cả từ vựng đã biết nghĩa xuất hiện trong câu hiện tại
        const currentText = nextSubtitle.koreanText || "";
        const matchedVocabs = vocabList.filter(v =>
            v.meaning && v.meaning !== "Đang tra cứu..." && v.word && currentText.includes(v.word)
        );
        // Kiểm tra thêm từ NotebookLM trong câu
        const notebookText = document.getElementById("notebooklm-vocab").value;
        const notebookMatches = notebookText.split('\n').filter(l => l.trim()).reduce((acc, line) => {
            const word = line.split(':')[0]?.trim();
            if (word && currentText.includes(word)) {
                const meaning = line.split(':').slice(1).join(':').trim();
                if (!acc.find(x => x.word === word)) acc.push({ word, meaning, fromNotebook: true });
            }
            return acc;
        }, []);

        if (matchedVocabs.length > 0 || notebookMatches.length > 0) {
            if (typeof displayVocabInfoMultiple === 'function') {
                displayVocabInfoMultiple(matchedVocabs, notebookMatches);
            }
        }

        // TTS pause khi gặp từ đã liên kết
        const autoVocabs = matchedVocabs.filter(v => v.isLinked).concat(notebookMatches.slice(0, 1));
        if (vocabPauseTTSEnabled && autoVocabs.length > 0 && currentSubtitleIndex !== lastVocabPauseIndex && !isVocabPauseSpeaking) {
            lastVocabPauseIndex = currentSubtitleIndex;
            triggerVocabPauseTTS(autoVocabs[0]);
            return;
        }

        const textToRead = ttsLanguage === "vi-VN" ? nextSubtitle.vietnameseText : nextSubtitle.koreanText;
        const currentTimeMs = Date.now();
        if (textToRead !== lastSpokenText || (currentTimeMs - lastSpokenTime) > 1000) {
            speechSynthesis.cancel();
            isSpeaking = true;
            readText(textToRead, () => { isSpeaking = false; });
            lastSpokenText = textToRead;
            lastSpokenTime = currentTimeMs;
        }
    }
}

function stopReading() {
    if (typeof speechSynthesis !== "undefined") { speechSynthesis.cancel(); isSpeaking = false; }
    if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
    lastVocabPauseIndex = -1;
    isVocabPauseSpeaking = false;
}

function rewindSubtitle() {
    if (!youtubePlayer || subtitleData.length === 0) { alert("Vui lòng tải video và phụ đề trước!"); return; }
    const currentTime = youtubePlayer.getCurrentTime();
    const rewindTime = Math.max(0, currentTime - 5);
    let newIndex = -1;
    for (let i = subtitleData.length - 1; i >= 0; i--) {
        if (subtitleData[i].startTime <= rewindTime) { newIndex = i; break; }
    }
    if (newIndex >= 0) {
        youtubePlayer.seekTo(rewindTime, true);
        currentSubtitleIndex = newIndex - 1;
        updateSubtitleDisplay(newIndex);
        if (youtubePlayer.getPlayerState() !== YT.PlayerState.PLAYING) youtubePlayer.playVideo();
    }
}

function checkManualSeek() {
    if (!youtubePlayer) return;
    const currentTime = youtubePlayer.getCurrentTime();
    const timeDiff = Math.abs(currentTime - lastCheckedTime);
    if (timeDiff > 1 && timeDiff < 10) { isManualSeeking = true; handleManualSeek(currentTime); }
    lastCheckedTime = currentTime;
}

function handleManualSeek(currentTime) {
    if (!subtitleData.length) return;
    let newIndex = -1;
    for (let i = 0; i < subtitleData.length; i++) {
        if (subtitleData[i].startTime <= currentTime) newIndex = i;
        else break;
    }
    if (newIndex >= 0 && newIndex !== currentSubtitleIndex) {
        currentSubtitleIndex = newIndex;
        lastVocabPauseIndex = -1;
        updateSubtitleDisplay(newIndex);
        if (isSpeaking) {
            const textToRead = ttsLanguage === "vi-VN" ? subtitleData[newIndex].vietnameseText : subtitleData[newIndex].koreanText;
            speechSynthesis.cancel();
            readText(textToRead, () => { isSpeaking = false; });
        }
    }
    isManualSeeking = false;
}

function updateSubtitleOffset(value) {
    const newOffset = parseFloat(value) || 0;
    if (Math.abs(newOffset - subtitleOffset) > 0.05) {
        subtitleOffset = newOffset;
        document.getElementById("offset-value").textContent = subtitleOffset.toFixed(1);
        localStorage.setItem("subtitleOffset", subtitleOffset);
        if (syncInterval) { clearInterval(syncInterval); syncInterval = setInterval(syncSubtitles, 300); syncSubtitles(); }
    }
}

function toggleNegativeOffset() {
    const input = document.getElementById("subtitle-offset");
    let value = parseFloat(input.value);
    if (value > 0) value = -value;
    else if (value < 0) value = Math.abs(value);
    else value = -0.1;
    input.value = value.toFixed(1);
    updateSubtitleOffset(input.value);
}

function applyOffsetToSubtitles() {
    const offset = parseFloat(document.getElementById("subtitle-offset").value) || 0;
    if (!subtitleData.length) { alert("Chưa có phụ đề để chỉnh thời gian."); return; }
    subtitleData.forEach(sub => {
        sub.startTime = Math.max(0, sub.startTime + offset);
        sub.endTime = Math.max(0, sub.endTime + offset);
    });
    subtitleOffset = 0;
    document.getElementById("subtitle-offset").value = "0";
    document.getElementById("offset-value").textContent = "0.0";
    localStorage.setItem("subtitleOffset", "0");
    displaySubtitleList();
    alert(`Đã áp dụng lệch ${offset} giây vĩnh viễn cho toàn bộ phụ đề.`);
}
