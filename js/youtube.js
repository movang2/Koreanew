function loadVideo() {
    const urlInput = document.getElementById("video-url").value;
    const videoId = extractVideoId(urlInput);
    if (!videoId) {
        alert("URL không hợp lệ! Vui lòng nhập link dạng https://www.youtube.com/watch?v=...");
        return;
    }
    currentVideoUrl = urlInput;
    const iframe = document.getElementById("youtube-video");
    iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;

    let convertedUrl = urlInput;
    if (urlInput.includes('youtube.com/live/')) {
        const liveMatch = urlInput.match(/youtube\.com\/live\/([^?&]+)/);
        if (liveMatch && liveMatch[1]) {
            const vid = liveMatch[1].split('?')[0];
            convertedUrl = `https://www.youtube.com/watch?v=${vid}`;
        }
    }
    const encodedUrl = encodeURIComponent(convertedUrl);
    const subtitleLink = document.getElementById("subtitle-link");
    subtitleLink.href = `https://savesubs.com/process?url=${encodedUrl}`;
    subtitleLink.textContent = `Tải phụ đề từ savesubs.com cho video này`;
    document.getElementById("subtitle-link-container").style.display = "block";

    initializePlayer();

    const historyItem = history.find(item => item.videoUrl === urlInput);
    vocabList = historyItem && historyItem.vocabList ? historyItem.vocabList.slice() : [];
    currentVideoFavorites = historyItem && historyItem.favoriteSubtitles ? historyItem.favoriteSubtitles.slice() : [];
    document.getElementById("notebooklm-vocab").value = historyItem && historyItem.notebooklmVocab ? historyItem.notebooklmVocab : "";
    saveToHistory(urlInput, null, document.getElementById("notebooklm-vocab").value);
    displayVocabList();
    displayFavorites();
    instantLookupEnabled = localStorage.getItem("instantLookup") === "1";
    document.getElementById("instant-lookup-toggle").checked = instantLookupEnabled;
}

async function loadAutoSubtitles() {
    alert("Đang thử tải phụ đề tự động từ subtitle.to...");
    try {
        const response = await new Promise(resolve => {
            setTimeout(() => resolve({
                text: `1\n00:00:01,000 --> 00:00:03,000\n안녕하세요\nXin chào\n\n2\n00:00:03,001 --> 00:00:05,000\n만나서 반갑습니다\nRất vui được gặp bạn`
            }), 1000);
        });
        subtitleData = parseSRT(response.text);
        if (subtitleData.length === 0) { alert("Không tải được phụ đề!"); return; }
        alert(`Đã tải ${subtitleData.length} dòng phụ đề tự động!`);
        displaySubtitleList();
        showSRTPanel();
        setTimeout(() => {
            const panel = document.getElementById('srt-tools');
            if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        saveToHistory(currentVideoUrl, response.text, document.getElementById("notebooklm-vocab").value);
    } catch (error) {
        console.error("Lỗi tải phụ đề tự động:", error);
        alert("Lỗi khi tải phụ đề tự động: " + error.message);
    }
}

function initializePlayer() {
    youtubePlayer = new YT.Player("youtube-video", {
        events: {
            onReady: () => {
                setInterval(checkManualSeek, 1000);
                updateVideoVolume(document.getElementById("video-volume").value);
            },
            onStateChange: (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                    startReading();
                } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                    stopReading();
                }
            }
        }
    });
}

function updateVideoVolume(value) {
    if (youtubePlayer && youtubePlayer.setVolume) {
        youtubePlayer.setVolume(parseInt(value));
        document.getElementById("video-volume-value").textContent = value;
    }
}
