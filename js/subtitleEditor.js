function showSRTPanel() {
    // Panel đã tích hợp vào giao diện chính, giữ hàm rỗng để không lỗi
}

function mergeSubtitles() {
    if (!subtitleData || subtitleData.length < 2) { alert("Không đủ dòng để gộp"); return; }
    const n = parseInt(document.getElementById("merge-lines-count").value) || 2;
    if (n < 2) { alert("Số dòng gộp phải ít nhất là 2!"); return; }
    let newData = [];
    for (let i = 0; i < subtitleData.length; i += n) {
        const group = subtitleData.slice(i, i + n);
        const first = group[0], last = group[group.length - 1];
        newData.push({
            startTime: first.startTime, endTime: last.endTime,
            koreanText: group.map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim(),
            vietnameseText: group.map(s => s.vietnameseText || "").join(" ").replace(/\s+/g, " ").trim(),
            fullText: group.map(s => ((s.koreanText || "") + " " + (s.vietnameseText || "")).trim()).join(" ").trim()
        });
    }
    subtitleData = newData; window.subtitleData = newData;
    if (typeof displaySubtitleList === 'function') displaySubtitleList();
    saveToHistory(currentVideoUrl, convertToSRT(subtitleData), document.getElementById("notebooklm-vocab").value);
    alert(`Đã gộp thành công! Gộp ${n} dòng → còn ${newData.length} dòng phụ đề.`);
}

function mergeByPunctuation() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề để xử lý!"); return; }
    const before = subtitleData.length;
    const newData = [];
    let currentGroup = [];
    for (let i = 0; i < subtitleData.length; i++) {
        const sub = subtitleData[i];
        currentGroup.push(sub);
        const endsWithPunctuation = /[.!?…]$/.test(sub.koreanText.trim());
        if (endsWithPunctuation || i === subtitleData.length - 1) {
            const first = currentGroup[0], last = currentGroup[currentGroup.length - 1];
            newData.push({
                startTime: first.startTime, endTime: last.endTime,
                koreanText: currentGroup.map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim(),
                vietnameseText: currentGroup.map(s => s.vietnameseText || "").join(" ").replace(/\s+/g, " ").trim(),
                fullText: currentGroup.map(s => ((s.koreanText || "") + " " + (s.vietnameseText || "")).trim()).join(" ").trim()
            });
            currentGroup = [];
        }
    }
    if (newData.length === before) { alert("Không có câu nào cần gộp (các dòng đã kết thúc bằng dấu chấm)."); return; }
    subtitleData = newData; window.subtitleData = newData;
    if (typeof displaySubtitleList === "function") displaySubtitleList();
    saveToHistory(currentVideoUrl, convertToSRT(subtitleData), document.getElementById("notebooklm-vocab").value);
    alert(`✅ Đã gộp từ ${before} dòng xuống còn ${newData.length} dòng!`);
}

function mergeByPunctuationAdvanced() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề để xử lý!"); return; }
    const before = subtitleData.length;
    const newData = [];
    let currentGroup = [];
    for (let i = 0; i < subtitleData.length; i++) {
        const sub = subtitleData[i];
        currentGroup.push(sub);
        const endsWithPunctuation = /[.!?…]$/.test(sub.koreanText.trim());
        if (endsWithPunctuation || i === subtitleData.length - 1) {
            const first = currentGroup[0], last = currentGroup[currentGroup.length - 1];
            const fullKorean = currentGroup.map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim();
            const fullVietnamese = currentGroup.map(s => s.vietnameseText || "").join(" ").replace(/\s+/g, " ").trim();
            newData.push({
                startTime: first.startTime, endTime: last.endTime,
                koreanText: fullKorean, vietnameseText: fullVietnamese,
                fullText: (fullKorean + " " + fullVietnamese).trim(),
                _original: currentGroup.map(s => ({ text: s.koreanText, start: s.startTime, end: s.endTime }))
            });
            currentGroup = [];
        }
    }
    if (newData.length === before) { alert("Không có câu nào cần gộp!"); return; }
    subtitleData = newData; window.subtitleData = newData;
    if (typeof displaySubtitleList === "function") displaySubtitleList();
    saveToHistory(currentVideoUrl, convertToSRT(subtitleData), document.getElementById("notebooklm-vocab").value);
    alert(`✅ Đã gộp ${before} dòng → ${newData.length} dòng\n📌 Video sẽ phát đúng theo khung thời gian mới!`);
}

function previewMergeByPunctuation() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề!"); return; }
    let preview = "";
    let currentGroup = [];
    let groupIndex = 1;
    for (let i = 0; i < subtitleData.length; i++) {
        const sub = subtitleData[i];
        currentGroup.push(sub);
        const endsWithPunctuation = /[.!?…]$/.test(sub.koreanText.trim());
        if (endsWithPunctuation || i === subtitleData.length - 1) {
            if (currentGroup.length > 1) {
                const t0 = formatTime(currentGroup[0].startTime);
                const t1 = formatTime(currentGroup[currentGroup.length - 1].endTime);
                preview += "📦 Nhóm " + groupIndex + " (" + currentGroup.length + " dòng — " + t0 + " → " + t1 + "):\n";
                currentGroup.forEach(function(s, idx) {
                    const prefix = (idx === currentGroup.length - 1) ? "   └ " : "   ├ ";
                    preview += prefix + (s.koreanText || "").substring(0, 60) + "\n";
                });
            } else {
                preview += "📄 Dòng " + groupIndex + " — " + (currentGroup[0].koreanText || "").substring(0, 60) + "\n";
            }
            preview += "\n";
            currentGroup = [];
            groupIndex++;
        }
    }
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:16px;padding:24px;width:min(560px,92vw);max-height:80vh;overflow:auto;z-index:10001;box-shadow:0 20px 60px rgba(0,0,0,0.35);border:2px solid #3b82f6;";
    modal.innerHTML = "<h3 style='margin:0 0 12px;color:#1e293b;font-size:16px;'>🔍 Xem trước khi gộp theo dấu chấm</h3>" +
        "<pre style='font-size:12px;white-space:pre-wrap;font-family:monospace;background:#f8fafc;padding:12px;border-radius:8px;max-height:55vh;overflow:auto;line-height:1.6;'>" + preview.replace(/</g, "&lt;") + "</pre>" +
        "<div style='display:flex;gap:8px;margin-top:16px;justify-content:flex-end;'>" +
        "<button onclick='this.closest(\"div[style]\").remove()' style='padding:7px 18px;border-radius:8px;border:1px solid #ccc;cursor:pointer;'>Đóng</button>" +
        "<button onclick='mergeByPunctuation();this.closest(\"div[style]\").remove()' style='background:#10b981;color:white;border:none;padding:7px 18px;border-radius:8px;cursor:pointer;font-weight:600;'>✅ Tiến hành gộp</button>" +
        "<button onclick='mergeByPunctuationAdvanced();this.closest(\"div[style]\").remove()' style='background:#8b5cf6;color:white;border:none;padding:7px 18px;border-radius:8px;cursor:pointer;font-weight:600;'>⚡ Gộp thông minh</button>" +
        "</div>";
    document.body.appendChild(modal);
}

function smartMergeByMeaning() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề để xử lý!"); return; }
    const before = subtitleData.length;
    const maxLinesToMerge = 4;
    const newData = [];
    let i = 0;
    while (i < subtitleData.length) {
        let group = [];
        let hasPunctuation = false;
        let j = i;
        while (j < subtitleData.length && (j - i) < maxLinesToMerge) {
            const sub = subtitleData[j];
            group.push(sub);
            if (/[.!?…]$/.test((sub.koreanText || "").trim())) { hasPunctuation = true; j++; break; }
            j++;
        }
        if (!hasPunctuation && group.length > 1 && group.length < maxLinesToMerge) {
            let extra = 0;
            while (j < subtitleData.length && extra < 2) {
                const nextSub = subtitleData[j];
                if ((nextSub.koreanText || "").trim().length > 0) { group.push(nextSub); j++; extra++; }
                else break;
            }
        }
        const first = group[0], last = group[group.length - 1];
        let mergedKorean = group.map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim();
        let mergedVietnamese = group.map(s => s.vietnameseText || "").join(" ").replace(/\s+/g, " ").trim();
        newData.push({ startTime: first.startTime, endTime: last.endTime, koreanText: mergedKorean, vietnameseText: mergedVietnamese || "", fullText: (mergedKorean + " " + (mergedVietnamese || "")).trim() });
        i = j;
    }
    if (newData.length === before) { alert("Không có dòng nào cần gộp!"); return; }
    subtitleData = newData; window.subtitleData = newData;
    if (typeof displaySubtitleList === "function") displaySubtitleList();
    saveToHistory(currentVideoUrl, convertToSRT(subtitleData), document.getElementById("notebooklm-vocab").value);
    alert(`✅ Đã gộp từ ${before} dòng xuống còn ${newData.length} dòng!`);
}

function removeCharsFromSRT() {
    const input = document.getElementById("chars-remove-srt").value;
    if (!input) { alert("Vui lòng nhập chuỗi cần xóa!"); return; }
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề để xử lý!"); return; }
    const patterns = input.split(",").map(s => s.trim()).filter(s => s);
    if (patterns.length === 0) { alert("Không có chuỗi hợp lệ để xóa!"); return; }
    subtitleData = subtitleData.map(sub => {
        let k = sub.koreanText || "", v = sub.vietnameseText || "";
        patterns.forEach(pattern => { k = k.split(pattern).join(""); v = v.split(pattern).join(""); });
        k = k.replace(/\s+/g, " ").trim(); v = v.replace(/\s+/g, " ").trim();
        return { ...sub, koreanText: k, vietnameseText: v, fullText: (k + " " + v).trim() };
    });
    window.subtitleData = subtitleData;
    if (typeof displaySubtitleList === 'function') displaySubtitleList();
    saveToHistory(currentVideoUrl, convertToSRT(subtitleData), document.getElementById("notebooklm-vocab").value);
    alert("Đã xóa chuỗi trong SRT thành công!");
}

function downloadEditedSRT() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề để tải!"); return; }
    const srt = convertToSRT(subtitleData);
    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "edited_subtitles.srt";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}
