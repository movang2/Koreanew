function findBestSubtitleIndex(vocabWord) {
    const cleanVocab = vocabWord.replace(/[^\p{Script=Hangul}]+/gu, "").trim().substring(0, 2);
    if (cleanVocab.length < 2) return -1;
    for (let i = 0; i < subtitleData.length; i++) {
        const subtitleText = subtitleData[i].koreanText;
        const wordsInSubtitle = subtitleText.split(/\s+/);
        for (let word of wordsInSubtitle) {
            const cleanWord = word.replace(/[^\p{Script=Hangul}]+/gu, "").trim();
            if (cleanWord.length >= 2 && cleanWord.substring(0, 2) === cleanVocab) return i;
        }
    }
    return -1;
}

function linkVocabToSubtitles() {
    const vocabText = document.getElementById("notebooklm-vocab").value;
    const vocabArray = vocabText
        .split("\n")
        .map(v => {
            const match = v.match(/[\p{Script=Hangul}]+(?:\s+[\p{Script=Hangul}]+)*/gu);
            const korean = match ? match[0].trim() : "";
            const meaningMatch = v.split(":").slice(1).join(":").trim();
            const meaning = meaningMatch ? meaningMatch : "";
            return korean ? { korean, meaning } : null;
        })
        .filter(v => v);
    const container = document.getElementById("linked-vocab-list");
    container.innerHTML = "";

    vocabArray.forEach(word => {
        const matchIndex = findBestSubtitleIndex(word.korean);
        if (matchIndex !== -1) {
            let existing = vocabList.find(v => v.word === word.korean);
            if (!existing) {
                vocabList.push({ word: word.korean, meaning: word.meaning, savedIndexes: [matchIndex], isLinked: true });
            } else {
                existing.meaning = word.meaning;
                existing.savedIndexes = [matchIndex];
                existing.isLinked = true;
            }
        }
        const div = document.createElement("div");
        div.textContent = `${word.korean}${word.meaning ? ` - ${word.meaning}` : ""}`;
        div.className = "clickable-vocab";
        div.onclick = () => {
            const matchIndex = findBestSubtitleIndex(word.korean);
            if (matchIndex !== -1) {
                youtubePlayer.seekTo(subtitleData[matchIndex].startTime, true);
                youtubePlayer.playVideo();
                highlightSubtitle(matchIndex);
                if (vocabTTSMode) readTextDual(`${word.korean} - ${word.meaning}`);
            } else {
                alert("Không tìm thấy từ gần giống trong phụ đề");
            }
        };
        container.appendChild(div);
    });
    saveToHistory(currentVideoUrl, null, vocabText);
}

function removeCharacters() {
    const textArea = document.getElementById("notebooklm-vocab");
    const input = document.getElementById("chars-to-remove").value;
    if (textArea && input) {
        let content = textArea.value;
        const patterns = input.split(",").map(s => s.trim()).filter(s => s);
        patterns.forEach(pattern => { content = content.split(pattern).join(""); });
        textArea.value = content;
    }
}
