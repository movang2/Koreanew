function handleWordClick(word, subtitleIndex) {
    let existing = vocabList.find(item => item.word === word);
    if (!existing) {
        existing = { word, meaning: "Đang tra cứu...", savedIndexes: [] };
        if (subtitleIndex !== undefined) existing.savedIndexes.push(subtitleIndex);
        vocabList.push(existing);
        saveVocabToHistory();
        displayVocabList();
    } else {
        if (!existing.savedIndexes) existing.savedIndexes = [];
        if (subtitleIndex !== undefined && !existing.savedIndexes.includes(subtitleIndex)) {
            existing.savedIndexes.push(subtitleIndex);
            saveVocabToHistory();
        }
    }
    lookupWord(word);
}

function lookupWord(word) {
    const existingVocab = vocabList.find(item => item.word === word);
    if (!existingVocab) { vocabList.push({ word, meaning: "Đang tra cứu..." }); saveVocabToHistory(); displayVocabList(); }
    const notebookVocab = getNotebookVocabInfo(word);
    const naverEnabled = document.getElementById('naver-lookup-toggle').checked;
    if (naverEnabled) {
        openNaverDict(word);
        if (!existingVocab) fetchGoogleTranslate(word);
    } else {
        const event = window.event;
        const mouseX = event ? event.clientX : window.innerWidth / 2;
        const mouseY = event ? event.clientY : window.innerHeight / 2;
        if (notebookVocab) {
            showTooltip(word, notebookVocab.meaning, 'notebook', mouseX, mouseY);
        } else if (existingVocab && existingVocab.meaning && existingVocab.meaning !== "Đang tra cứu...") {
            showTooltip(word, existingVocab.meaning, 'manual', mouseX, mouseY);
            if (!existingVocab.meaning || existingVocab.meaning === "Đang tra cứu...") fetchGoogleTranslate(word);
        } else {
            showTooltip(word, "Đang tra cứu...", '', mouseX, mouseY);
            fetchGoogleTranslate(word).then(() => {
                const updatedVocab = vocabList.find(item => item.word === word);
                if (updatedVocab && updatedVocab.meaning && updatedVocab.meaning !== "Đang tra cứu...") {
                    if (activeTooltip) { activeTooltip.remove(); activeTooltip = null; }
                    showTooltip(word, updatedVocab.meaning, 'google', mouseX, mouseY);
                }
            });
        }
    }
    displayVocabInfo(word, existingVocab || vocabList.find(item => item.word === word), notebookVocab);
}

function openNaverDict(word) {
    window.open(`https://korean.dict.naver.com/kovidict/#/search?query=${encodeURIComponent(word)}`, "_blank");
}

function toggleNaverLookup(enabled) {
    naverLookupEnabled = enabled;
    localStorage.setItem("naverLookup", enabled ? "1" : "0");
    displayVocabList();
    const mode = enabled ? '🌐 Mở Naver Dictionary' : '💬 Hiển thị tooltip thông minh';
    alert(`Đã chuyển sang chế độ: ${mode}\n${enabled ? 'Click vào từ sẽ mở tab Naver mới' : 'Click vào từ sẽ hiện tooltip nghĩa ngay tại chỗ'}`);
}

function toggleInstantLookup(enabled) {
    instantLookupEnabled = enabled;
    localStorage.setItem("instantLookup", enabled ? "1" : "0");
}

function toggleVocabDisplayMode() {
    vocabDisplayMode = !vocabDisplayMode;
    document.getElementById("vocab-display-mode").checked = vocabDisplayMode;
    localStorage.setItem("vocabDisplayMode", vocabDisplayMode);
    alert(`Chế độ hiển thị: ${vocabDisplayMode ? "CHỈ hiển thị thông tin" : "TRA TỪ trên Naver khi nhấp"}`);
}

function clearVocabDisplay() {
    document.getElementById("vocab-info-display").innerHTML = "👉 Nhấp vào từ vựng được tô màu trong phụ đề để xem chi tiết";
}

function getNotebookVocabInfo(word) {
    const notebookText = document.getElementById("notebooklm-vocab").value;
    if (!notebookText.trim()) return null;
    const lines = notebookText.split('\n');
    for (const line of lines) {
        if (line.includes(word)) {
            const parts = line.split(':');
            if (parts.length >= 2) return { korean: parts[0].trim(), meaning: parts.slice(1).join(':').trim() };
            else return { korean: line.trim(), meaning: '' };
        }
    }
    return null;
}

function displayVocabInfo(word, existingVocab, notebookVocab) {
    const container = document.getElementById("vocab-info-display");
    const sources = [];
    if (notebookVocab && notebookVocab.meaning && notebookVocab.meaning.trim() !== "") {
        sources.push({ type: 'notebook', icon: '📔', label: 'NotebookLM', meaning: notebookVocab.meaning, color: '#9c27b0' });
    }
    if (existingVocab && existingVocab.meaning && existingVocab.meaning !== "Đang tra cứu...") {
        const isDuplicate = sources.some(s => s.meaning === existingVocab.meaning);
        if (!isDuplicate) sources.push({ type: 'google', icon: '🌐', label: 'Google Dịch', meaning: existingVocab.meaning, color: '#4285f4' });
    }
    if (sources.length === 0) {
        container.innerHTML = `<div class="vocab-info-item" style="border-left-color:#607d8b;padding:15px;text-align:center;"><div style="color:#607d8b;font-style:italic;">👉 Nhấp vào từ vựng được tô màu trong phụ đề để xem chi tiết</div></div>`;
        return;
    }
    let html = `<div class="vocab-info-item" style="border-left-color:#4CAF50;padding:15px;">`;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:2px solid #f0f0f0;padding-bottom:8px;">
        <span style="font-size:10px;font-weight:bold;color:#2196F3;">${word}</span>
        ${sources.length > 1 ? `<span style="background:#4CAF50;color:white;padding:2px 5px;border-radius:9px;font-size:5px;font-weight:bold;">🥇 ${sources.length} nguồn</span>` : `<span style="background:#607d8b;color:white;padding:2px 5px;border-radius:9px;font-size:5px;">1 nguồn</span>`}
    </div>`;
    sources.forEach((source, index) => {
        html += `<div style="margin-bottom:${index < sources.length - 1 ? '4px' : '0'};background:${source.color}10;border-radius:8px;padding:5px;">
            <div style="display:flex;align-items:center;gap:2px;margin-bottom:2px;">
                <span style="font-size:9px;">${source.icon}</span>
                <span style="color:${source.color};font-weight:bold;font-size:7px;text-transform:uppercase;letter-spacing:0.5px;">${source.label}</span>
            </div>
            <div style="color:#333;margin-left:13px;line-height:1.3;word-break:break-word;font-size:8px;">${source.meaning}</div>
        </div>`;
    });
    html += `<div style="margin-top:15px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #eee;padding-top:12px;">
        <button onclick="openNaverDict('${word}')" style="background:#03c75a;color:white;border:none;border-radius:6px;padding:3px 5px;cursor:pointer;font-size:6px;display:flex;align-items:center;gap:5px;"><span>🇰🇷</span> Tra Naver</button>
        <button onclick="fetchGoogleTranslate('${word}')" style="background:#4285f4;color:white;border:none;border-radius:6px;padding:3px 5px;cursor:pointer;font-size:6px;display:flex;align-items:center;gap:5px;"><span>🌐</span> Dịch lại</button>
    </div></div>`;
    container.innerHTML = html;
}

function displayVocabInfoMultiple(googleVocabs, notebookMatches) {
    const container = document.getElementById("vocab-info-display");
    if (!container) return;

    // Gộp tất cả từ, tránh trùng
    const wordMap = new Map();
    notebookMatches.forEach(m => {
        wordMap.set(m.word, { word: m.word, sources: [{ type: 'notebook', icon: '📔', label: 'NotebookLM', meaning: m.meaning, color: '#9c27b0' }] });
    });
    googleVocabs.forEach(v => {
        if (wordMap.has(v.word)) {
            const entry = wordMap.get(v.word);
            const isDup = entry.sources.some(s => s.meaning === v.meaning);
            if (!isDup) entry.sources.push({ type: 'google', icon: '🌐', label: 'Google Dịch', meaning: v.meaning, color: '#4285f4' });
        } else {
            const nb = notebookMatches.find(m => m.word === v.word);
            const sources = [];
            if (nb) sources.push({ type: 'notebook', icon: '📔', label: 'NotebookLM', meaning: nb.meaning, color: '#9c27b0' });
            sources.push({ type: 'google', icon: '🌐', label: 'Google Dịch', meaning: v.meaning, color: '#4285f4' });
            wordMap.set(v.word, { word: v.word, sources });
        }
    });

    const entries = [...wordMap.values()];
    if (entries.length === 0) return;

    let html = '';
    entries.forEach((entry, ei) => {
        const borderColor = entry.sources.some(s => s.type === 'notebook') ? '#9c27b0' : '#4285f4';
        html += `<div class="vocab-info-item" style="border-left-color:${borderColor};padding:12px;${ei > 0 ? 'margin-top:8px;border-top:2px solid #f0f0f0;' : ''}">`;
        html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:bold;color:#2196F3;">${entry.word}</span>
            <span style="background:${borderColor};color:white;padding:2px 6px;border-radius:9px;font-size:9px;">${entry.sources.length > 1 ? '🥇 ' + entry.sources.length + ' nguồn' : entry.sources[0].label}</span>
        </div>`;
        entry.sources.forEach((source, si) => {
            html += `<div style="margin-bottom:${si < entry.sources.length - 1 ? '6px' : '0'};background:${source.color}10;border-radius:8px;padding:6px;">
                <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
                    <span style="font-size:10px;">${source.icon}</span>
                    <span style="color:${source.color};font-weight:bold;font-size:9px;text-transform:uppercase;">${source.label}</span>
                </div>
                <div style="color:#333;margin-left:15px;line-height:1.4;word-break:break-word;font-size:11px;">${source.meaning}</div>
            </div>`;
        });
        html += `<div style="margin-top:8px;display:flex;gap:6px;justify-content:flex-end;">
            <button onclick="openNaverDict('${entry.word}')" style="background:#03c75a;color:white;border:none;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:10px;">🇰🇷 Naver</button>
            <button onclick="fetchGoogleTranslate('${entry.word}')" style="background:#4285f4;color:white;border:none;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:10px;">🌐 Dịch lại</button>
        </div>`;
        html += '</div>';
    });

    // Header tổng hợp nếu có nhiều từ
    if (entries.length > 1) {
        html = `<div style="background:#e8f5e9;border-radius:8px;padding:6px 10px;margin-bottom:8px;font-size:11px;color:#2e7d32;font-weight:bold;">
            🔤 ${entries.length} từ vựng trong câu này
        </div>` + html;
    }

    container.innerHTML = html;
}

function findWordAppearances(word) {
    const result = [];
    const cleanWord = word.replace(/[^\p{Script=Hangul}]+/gu, "").trim();
    if (!cleanWord || !subtitleData.length) return result;
    subtitleData.forEach((sub, idx) => {
        if (sub.koreanText.includes(cleanWord)) result.push({ startTime: sub.startTime, subtitleIndex: idx });
    });
    return result;
}

async function fetchGoogleTranslate(text) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        const translated = data[0].map(x => x[0]).join('');
        const index = vocabList.findIndex(item => item.word === text);
        if (index !== -1) {
            vocabList[index].meaning = translated;
            saveVocabToHistory(); displayVocabList(); updateSubtitleDisplay(currentSubtitleIndex);
        } else {
            vocabList.push({ word: text, meaning: translated });
            saveVocabToHistory(); displayVocabList();
        }
        return translated;
    } catch (e) {
        console.error("Lỗi dịch Google:", e);
        return null;
    }
}

async function translateAllVocab() {
    for (let item of vocabList) {
        if (!item.meaning || item.meaning === "Đang tra cứu...") {
            await fetchGoogleTranslate(item.word);
            await new Promise(r => setTimeout(r, 200));
        }
    }
    alert("Đã dịch xong tất cả từ vựng!");
}

function displayVocabList() {
    const vocabListDiv = document.getElementById("vocab-list");
    vocabListDiv.innerHTML = "";
    vocabList.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "vocab-item";
        if (naverLookupEnabled) {
            div.className = "vocab-item-naver";
            div.innerHTML = `<div><span class="korean-word clickable" onclick="openNaverDict('${item.word}')">${item.word}</span> <span class="vietnamese translation">${item.meaning}</span></div> <button onclick="deleteVocab(${index})">Xóa</button>`;
        } else {
            div.innerHTML = `<input type="text" value="${item.word}" onchange="editVocab(${index},'word',this.value)"> <input type="text" value="${item.meaning}" placeholder="Nhập nghĩa..." onchange="editVocab(${index},'meaning',this.value)"> <button onclick="deleteVocab(${index})">Xóa</button>`;
        }
        vocabListDiv.appendChild(div);
    });
}

function editVocab(index, field, value) {
    vocabList[index][field] = value;
    saveVocabToHistory();
}

function deleteVocab(index) {
    vocabList.splice(index, 1);
    saveVocabToHistory();
    displayVocabList();
}

function saveVocabToHistory() {
    const existingIndex = history.findIndex(item => item.videoUrl === currentVideoUrl);
    if (existingIndex !== -1) {
        history[existingIndex].vocabList = vocabList.slice();
        history[existingIndex].notebooklmVocab = document.getElementById("notebooklm-vocab").value;
        history[existingIndex].favoriteSubtitles = currentVideoFavorites.slice();
        localStorage.setItem("videoHistory", JSON.stringify(history));
    }
}
