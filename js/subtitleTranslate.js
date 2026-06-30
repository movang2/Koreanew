async function translateSRT() {
    if (!subtitleData.length) { alert("Vui lòng tải phụ đề trước!"); return; }
    const hasVietnamese = subtitleData.some(sub => sub.vietnameseText && sub.vietnameseText.trim() !== "");
    if (hasVietnamese) { alert("Phụ đề đã có bản dịch tiếng Việt!"); return; }
    if (!confirm(`Bạn có chắc muốn dịch ${subtitleData.length} dòng phụ đề sang tiếng Việt? Quá trình này có thể mất khoảng ${Math.ceil(subtitleData.length * 0.5 / 60)} phút.`)) return;
    try {
        const wasPlaying = youtubePlayer && youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING;
        if (wasPlaying) youtubePlayer.pauseVideo();
        document.getElementById("translation-progress").style.display = "block";
        for (let i = 0; i < subtitleData.length; i++) {
            const sub = subtitleData[i];
            const progress = Math.floor((i / subtitleData.length) * 100);
            document.getElementById("progress-bar").value = progress;
            document.getElementById("progress-text").textContent = `Đang dịch... ${progress}%`;
            sub.vietnameseText = await translateText(sub.koreanText);
            sub.fullText = `${sub.koreanText} ${sub.vietnameseText}`;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        document.getElementById("translation-progress").style.display = "none";
        alert(`Đã dịch xong ${subtitleData.length} dòng phụ đề!`);
        displaySubtitleList();
        saveToHistory(currentVideoUrl, convertToSRT(subtitleData), document.getElementById("notebooklm-vocab").value);
        if (wasPlaying) youtubePlayer.playVideo();
    } catch (error) {
        console.error("Lỗi khi dịch phụ đề:", error);
        document.getElementById("translation-progress").style.display = "none";
        alert("Lỗi khi dịch phụ đề: " + error.message);
    }
}

async function translateText(text) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0].map(x => x[0]).join('');
    } catch (e) {
        console.error("Lỗi dịch Google:", e);
        return "[Lỗi dịch]";
    }
}

function convertToSRT(subtitles) {
    let srtContent = "";
    subtitles.forEach((sub, index) => {
        const startTime = formatTimeForSRT(sub.startTime);
        const endTime = formatTimeForSRT(sub.endTime || sub.startTime + 2);
        srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${sub.koreanText}\n${sub.vietnameseText || ''}\n\n`;
    });
    return srtContent;
}
