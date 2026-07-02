function showSRTPanel() {}

/* ===== GỘP N DÒNG ===== */
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

/* ===== GỘP THEO DẤU CHẤM (có giới hạn ký tự) ===== */
function mergeByPunctuation() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề để xử lý!"); return; }
    const MAX_CHARS = _getMaxChars();
    const before = subtitleData.length;
    const newData = [];
    let currentGroup = [];
    for (let i = 0; i < subtitleData.length; i++) {
        const sub = subtitleData[i];
        const wouldBe = [...currentGroup, sub].map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim();
        // Cắt nếu vượt giới hạn ký tự
        if (currentGroup.length > 0 && wouldBe.length > MAX_CHARS) {
            _pushGroup(newData, currentGroup);
            currentGroup = [sub];
        } else {
            currentGroup.push(sub);
        }
        const endsWithPunctuation = /[.!?…]$/.test((sub.koreanText || "").trim());
        if (endsWithPunctuation || i === subtitleData.length - 1) {
            if (currentGroup.length > 0) { _pushGroup(newData, currentGroup); currentGroup = []; }
        }
    }
    if (currentGroup.length > 0) _pushGroup(newData, currentGroup);
    if (newData.length === before) { alert("Không có câu nào cần gộp."); return; }
    _applyAndSave(newData, before, "📖 Gộp theo dấu chấm");
}

/* ===== GỘP THÔNG MINH (giữ metadata) ===== */
function mergeByPunctuationAdvanced() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề để xử lý!"); return; }
    const MAX_CHARS = _getMaxChars();
    const before = subtitleData.length;
    const newData = [];
    let currentGroup = [];
    for (let i = 0; i < subtitleData.length; i++) {
        const sub = subtitleData[i];
        const wouldBe = [...currentGroup, sub].map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim();
        if (currentGroup.length > 0 && wouldBe.length > MAX_CHARS) {
            _pushGroupAdvanced(newData, currentGroup);
            currentGroup = [sub];
        } else {
            currentGroup.push(sub);
        }
        const endsWithPunctuation = /[.!?…]$/.test((sub.koreanText || "").trim());
        if (endsWithPunctuation || i === subtitleData.length - 1) {
            if (currentGroup.length > 0) { _pushGroupAdvanced(newData, currentGroup); currentGroup = []; }
        }
    }
    if (currentGroup.length > 0) _pushGroupAdvanced(newData, currentGroup);
    if (newData.length === before) { alert("Không có câu nào cần gộp!"); return; }
    _applyAndSave(newData, before, "⚡ Gộp thông minh");
}

/* ===== GỘP THEO NGỮ NGHĨA (cải tiến — giới hạn ký tự + đổi người nói) ===== */
function smartMergeByMeaning() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề để xử lý!"); return; }
    const MAX_CHARS = _getMaxChars();
    const before = subtitleData.length;
    const newData = [];
    let i = 0;

    while (i < subtitleData.length) {
        let group = [];
        let j = i;

        while (j < subtitleData.length) {
            const sub = subtitleData[j];
            const subText = (sub.koreanText || "").trim();

            if (group.length === 0) {
                group.push(sub);
                j++;
                if (/[.!?…]$/.test(subText)) break; // câu đơn đã đủ
                continue;
            }

            // Đổi người nói → cắt
            if (subText.startsWith(">>")) break;

            // Kiểm tra giới hạn ký tự trước khi thêm
            const currentText = group.map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim();
            const potential = (currentText + " " + subText).replace(/\s+/g, " ").trim();
            if (potential.length > MAX_CHARS) break;

            // Nhóm hiện tại đã kết thúc câu → không gộp thêm
            if (/[.!?…]$/.test(currentText)) break;

            group.push(sub);
            j++;

            // Vừa thêm xong mà kết thúc câu → dừng
            const merged = group.map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim();
            if (/[.!?…]$/.test(merged)) break;
        }

        _pushGroup(newData, group);
        i = j;
    }

    if (newData.length === before) { alert("Không có dòng nào cần gộp!"); return; }
    _applyAndSave(newData, before, "🧠 Gộp theo ngữ nghĩa");
}

/* ===== TÁCH CÂU DÀI (mới) ===== */
function splitLongSubtitles() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề!"); return; }
    const MAX_CHARS = _getMaxChars();
    const before = subtitleData.length;
    const newData = [];

    for (const sub of subtitleData) {
        const text = (sub.koreanText || "").trim();
        if (text.length <= MAX_CHARS) {
            newData.push(sub);
            continue;
        }
        // Tách tại dấu câu trước hết
        const sentenceBreaks = [];
        const sentenceRe = /[^.!?…]+[.!?…]+/g;
        let m;
        while ((m = sentenceRe.exec(text)) !== null) sentenceBreaks.push(m[0].trim());
        const remainder = text.slice(sentenceRe.lastIndex).trim();
        if (remainder) sentenceBreaks.push(remainder);

        if (sentenceBreaks.length > 1) {
            // Phân bổ thời gian đều theo độ dài ký tự
            const totalLen = text.length;
            let cursor = sub.startTime;
            const totalDur = sub.endTime - sub.startTime;
            for (const chunk of sentenceBreaks) {
                const dur = (chunk.length / totalLen) * totalDur;
                newData.push({
                    startTime: cursor,
                    endTime: Math.min(cursor + dur, sub.endTime),
                    koreanText: chunk,
                    vietnameseText: sub.vietnameseText || "",
                    fullText: (chunk + " " + (sub.vietnameseText || "")).trim()
                });
                cursor += dur;
            }
        } else {
            // Không có dấu câu → tách theo từ tại ~MAX_CHARS
            const words = text.split(/\s+/);
            let current = "";
            const totalLen = text.length;
            let cursor = sub.startTime;
            const totalDur = sub.endTime - sub.startTime;
            const chunks = [];
            for (const w of words) {
                const trial = current ? current + " " + w : w;
                if (trial.length > MAX_CHARS && current) {
                    chunks.push(current);
                    current = w;
                } else {
                    current = trial;
                }
            }
            if (current) chunks.push(current);
            for (const chunk of chunks) {
                const dur = (chunk.length / totalLen) * totalDur;
                newData.push({
                    startTime: cursor,
                    endTime: Math.min(cursor + dur, sub.endTime),
                    koreanText: chunk,
                    vietnameseText: sub.vietnameseText || "",
                    fullText: (chunk + " " + (sub.vietnameseText || "")).trim()
                });
                cursor += dur;
            }
        }
    }

    if (newData.length === before) { alert(`Không có câu nào vượt ${MAX_CHARS} ký tự.`); return; }
    _applyAndSave(newData, before, `✂️ Tách câu dài (>${MAX_CHARS} ký tự)`);
}

/* ===== XEM TRƯỚC GỘP ===== */
function previewMergeByPunctuation() {
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề!"); return; }
    const MAX_CHARS = _getMaxChars();
    let preview = "";
    let currentGroup = [];
    let groupIndex = 1;
    for (let i = 0; i < subtitleData.length; i++) {
        const sub = subtitleData[i];
        const wouldBe = [...currentGroup, sub].map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim();
        if (currentGroup.length > 0 && wouldBe.length > MAX_CHARS) {
            _previewGroup(currentGroup, groupIndex, preview); groupIndex++;
            preview = _previewGroup(currentGroup, groupIndex - 1, "");
            currentGroup = [sub];
        } else {
            currentGroup.push(sub);
        }
        const endsWithPunctuation = /[.!?…]$/.test((sub.koreanText || "").trim());
        if (endsWithPunctuation || i === subtitleData.length - 1) {
            if (currentGroup.length > 0) {
                preview += _previewGroup(currentGroup, groupIndex, "");
                currentGroup = []; groupIndex++;
            }
        }
    }
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:16px;padding:24px;width:min(560px,92vw);max-height:80vh;overflow:auto;z-index:10001;box-shadow:0 20px 60px rgba(0,0,0,0.35);border:2px solid #3b82f6;";
    modal.innerHTML = "<h3 style='margin:0 0 12px;color:#1e293b;font-size:16px;'>🔍 Xem trước gộp (giới hạn " + MAX_CHARS + " ký tự)</h3>" +
        "<pre style='font-size:12px;white-space:pre-wrap;font-family:monospace;background:#f8fafc;padding:12px;border-radius:8px;max-height:55vh;overflow:auto;line-height:1.6;'>" + preview.replace(/</g, "&lt;") + "</pre>" +
        "<div style='display:flex;gap:8px;margin-top:16px;justify-content:flex-end;flex-wrap:wrap;'>" +
        "<button onclick='this.closest(\"div\").parentElement.remove()' style='padding:7px 18px;border-radius:8px;border:1px solid #ccc;cursor:pointer;'>Đóng</button>" +
        "<button onclick='mergeByPunctuation();this.closest(\"div\").parentElement.remove()' style='background:#10b981;color:white;border:none;padding:7px 18px;border-radius:8px;cursor:pointer;font-weight:600;'>📖 Gộp theo dấu chấm</button>" +
        "<button onclick='mergeByPunctuationAdvanced();this.closest(\"div\").parentElement.remove()' style='background:#8b5cf6;color:white;border:none;padding:7px 18px;border-radius:8px;cursor:pointer;font-weight:600;'>⚡ Gộp thông minh</button>" +
        "<button onclick='smartMergeByMeaning();this.closest(\"div\").parentElement.remove()' style='background:#7c3aed;color:white;border:none;padding:7px 18px;border-radius:8px;cursor:pointer;font-weight:600;'>🧠 Gộp ngữ nghĩa</button>" +
        "</div>";
    document.body.appendChild(modal);
}

function _previewGroup(group, idx, acc) {
    if (group.length > 1) {
        const t0 = typeof formatTime === 'function' ? formatTime(group[0].startTime) : "";
        const t1 = typeof formatTime === 'function' ? formatTime(group[group.length - 1].endTime) : "";
        acc += "📦 Nhóm " + idx + " (" + group.length + " dòng — " + t0 + " → " + t1 + "):\n";
        group.forEach(function (s, i) {
            acc += (i === group.length - 1 ? "   └ " : "   ├ ") + (s.koreanText || "").substring(0, 60) + "\n";
        });
    } else {
        acc += "📄 Dòng " + idx + " — " + (group[0].koreanText || "").substring(0, 60) + "\n";
    }
    return acc + "\n";
}

/* ===== XÓA KÝ TỰ TRONG SRT ===== */
function removeCharsFromSRT() {
    const input = document.getElementById("chars-remove-srt").value;
    if (!input) { alert("Vui lòng nhập chuỗi cần xóa!"); return; }
    if (!subtitleData || subtitleData.length === 0) { alert("Chưa có phụ đề để xử lý!"); return; }
    const patterns = input.split(",").map(s => s.trim()).filter(s => s);
    if (patterns.length === 0) { alert("Không có chuỗi hợp lệ để xóa!"); return; }
    subtitleData = subtitleData.map(sub => {
        let k = sub.koreanText || "", v = sub.vietnameseText || "";
        patterns.forEach(p => { k = k.split(p).join(""); v = v.split(p).join(""); });
        k = k.replace(/\s+/g, " ").trim(); v = v.replace(/\s+/g, " ").trim();
        return { ...sub, koreanText: k, vietnameseText: v, fullText: (k + " " + v).trim() };
    });
    window.subtitleData = subtitleData;
    if (typeof displaySubtitleList === 'function') displaySubtitleList();
    saveToHistory(currentVideoUrl, convertToSRT(subtitleData), document.getElementById("notebooklm-vocab").value);
    alert("Đã xóa chuỗi trong SRT thành công!");
}

/* ===== TẢI SRT ===== */
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

/* ===== HELPERS ===== */
function _getMaxChars() {
    const el = document.getElementById("smart-merge-max-chars");
    return el ? (parseInt(el.value) || 80) : 80;
}

function _pushGroup(arr, group) {
    if (!group || group.length === 0) return;
    const first = group[0], last = group[group.length - 1];
    arr.push({
        startTime: first.startTime, endTime: last.endTime,
        koreanText: group.map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim(),
        vietnameseText: group.map(s => s.vietnameseText || "").join(" ").replace(/\s+/g, " ").trim(),
        fullText: group.map(s => ((s.koreanText || "") + " " + (s.vietnameseText || "")).trim()).join(" ").trim()
    });
}

function _pushGroupAdvanced(arr, group) {
    if (!group || group.length === 0) return;
    const first = group[0], last = group[group.length - 1];
    const k = group.map(s => s.koreanText || "").join(" ").replace(/\s+/g, " ").trim();
    const v = group.map(s => s.vietnameseText || "").join(" ").replace(/\s+/g, " ").trim();
    arr.push({
        startTime: first.startTime, endTime: last.endTime,
        koreanText: k, vietnameseText: v,
        fullText: (k + " " + v).trim(),
        _original: group.map(s => ({ text: s.koreanText, start: s.startTime, end: s.endTime }))
    });
}

function _applyAndSave(newData, before, label) {
    subtitleData = newData; window.subtitleData = newData;
    if (typeof displaySubtitleList === "function") displaySubtitleList();
    saveToHistory(currentVideoUrl, convertToSRT(subtitleData), document.getElementById("notebooklm-vocab").value);
    alert(`✅ ${label}: ${before} dòng → ${newData.length} dòng`);
}
