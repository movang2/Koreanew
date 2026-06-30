function addFavoriteToCurrentVideo(index) {
    const sub = subtitleData[index];
    if (!sub) return;
    const existing = currentVideoFavorites.find(item => item.koreanText === sub.koreanText && item.vietnameseText === sub.vietnameseText);
    if (!existing) {
        currentVideoFavorites.push(sub);
        saveVocabToHistory();
        displayFavorites();
        alert("Đã thêm vào phụ đề yêu thích!");
    } else {
        alert("Phụ đề này đã có trong danh sách yêu thích của video này.");
    }
}

function removeFavorite(index) {
    currentVideoFavorites.splice(index, 1);
    saveVocabToHistory();
    displayFavorites();
}

function displayFavorites() {
    const favoriteList = document.getElementById("favorite-subtitles");
    favoriteList.innerHTML = "";
    currentVideoFavorites.forEach((sub, index) => {
        const div = document.createElement("div");
        div.className = "subtitle-item";
        div.innerHTML = `<span class="korean">${sub.koreanText}</span> <span class="vietnamese">${sub.vietnameseText}</span> <button onclick="removeFavorite(${index}); event.stopPropagation();">Xóa</button>`;
        div.onclick = () => jumpToSubtitleByText(sub.koreanText);
        favoriteList.appendChild(div);
    });
}

function clearAllFavorites() {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ phụ đề yêu thích của video hiện tại?")) {
        currentVideoFavorites = [];
        saveVocabToHistory();
        displayFavorites();
    }
}

function jumpToSubtitleByText(text) {
    const index = subtitleData.findIndex(sub => sub.koreanText === text);
    if (index !== -1) jumpToSubtitle(index);
    else alert("Không tìm thấy phụ đề tương ứng trong video hiện tại.");
}
