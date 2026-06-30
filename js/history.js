function saveToHistory(videoUrl, srtContent, notebooklmVocab) {
    currentVideoUrl = videoUrl;
    const existingIndex = history.findIndex(item => item.videoUrl === videoUrl);
    const currentVocab = vocabList.slice();
    const currentFavorites = currentVideoFavorites.slice();
    if (existingIndex !== -1) {
        history[existingIndex].srtContent = srtContent || history[existingIndex].srtContent;
        history[existingIndex].vocabList = currentVocab;
        history[existingIndex].notebooklmVocab = notebooklmVocab || history[existingIndex].notebooklmVocab;
        history[existingIndex].favoriteSubtitles = currentFavorites;
    } else {
        history.push({ videoUrl, srtContent, vocabList: currentVocab, notebooklmVocab, favoriteSubtitles: currentFavorites });
    }
    localStorage.setItem("videoHistory", JSON.stringify(history));
    displayHistory();
}

function displayHistory() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";
    history.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `${item.videoUrl} ${item.srtContent ? "(Có phụ đề)" : ""} ${item.vocabList && item.vocabList.length > 0 ? `(${item.vocabList.length} từ vựng)` : ""} <button onclick="deleteHistoryItem(${index})">Xóa</button>`;
        div.onclick = (e) => { if (e.target.tagName !== "BUTTON") loadFromHistory(index); };
        historyList.appendChild(div);
    });
}

async function loadFromHistory(index) {
    const item = history[index];
    if (!item) return;
    document.getElementById("video-url").value = item.videoUrl;
    currentVideoUrl = item.videoUrl;
    loadVideo();
    try {
        await Promise.all([waitForPlayer(), waitForVoices()]);
        if (item.srtContent) {
            subtitleData = parseSRT(item.srtContent);
            displaySubtitleList();
        } else {
            subtitleData = [];
            document.getElementById("subtitle-list").innerHTML = "";
            document.getElementById("subtitle-display").innerHTML = "";
        }
        vocabList = item.vocabList ? item.vocabList.slice() : [];
        document.getElementById("notebooklm-vocab").value = item.notebooklmVocab || "";
        currentVideoFavorites = item.favoriteSubtitles ? item.favoriteSubtitles.slice() : [];
        displayVocabList();
        linkVocabToSubtitles();
        displayFavorites();
        instantLookupEnabled = localStorage.getItem("instantLookup") === "1";
        document.getElementById("instant-lookup-toggle").checked = instantLookupEnabled;
        if (ttsVolume === 0) alert("Âm lượng TTS hiện bằng 0. Vui lòng điều chỉnh thanh trượt âm lượng TTS.");
        if (youtubePlayer && youtubePlayer.playVideo) {
            youtubePlayer.playVideo();
            setTimeout(startReading, 1000);
        }
    } catch (error) {
        console.error("Lỗi khi tải lịch sử:", error);
        alert("Có lỗi xảy ra khi tải lịch sử: " + error.message);
    }
}

function deleteHistoryItem(index) {
    history.splice(index, 1);
    localStorage.setItem("videoHistory", JSON.stringify(history));
    displayHistory();
    displayFavorites();
}
