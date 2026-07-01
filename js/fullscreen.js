(function () {
    var isFullscreenActive = false;
    var fullscreenSyncInterval = null;

    function highlightKoreanWords(text, subtitleIndex) {
        if (!text) return text;
        var linkedVocabs = (window.vocabList || []).filter(function (v) {
            return v.savedIndexes && v.savedIndexes.includes(subtitleIndex);
        });
        var result = text;
        linkedVocabs.forEach(function (vocab) {
            var re = new RegExp('(' + vocab.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
            result = result.replace(re, '<span class="korean-word clickable" style="color:#ffd700;cursor:pointer;font-weight:bold;border-bottom:1px solid #ffd700;" onclick="handleWordClickInFullscreen(\'' + vocab.word + '\',' + subtitleIndex + ')">$1</span>');
        });
        (window.vocabList || []).forEach(function (vocab) {
            if (!linkedVocabs.some(function (v) { return v.word === vocab.word; })) {
                var re = new RegExp('(' + vocab.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
                result = result.replace(re, '<span class="korean-word clickable" style="color:#66ccff;cursor:pointer;border-bottom:1px dotted #66ccff;" onclick="handleWordClickInFullscreen(\'' + vocab.word + '\',' + subtitleIndex + ')">$1</span>');
            }
        });
        return result;
    }

    window.handleWordClickInFullscreen = function (word, subtitleIndex) {
        if (typeof handleWordClick === 'function') handleWordClick(word, subtitleIndex);
        setTimeout(function () {
            var vocabDisplay = document.getElementById('vocab-info-display');
            if (vocabDisplay) document.getElementById('fullscreen-vocab-content').innerHTML = vocabDisplay.innerHTML;
        }, 100);
    };

    function updateSubtitlePanel() {
        var data = window.subtitleData || [];
        var idx = window.currentSubtitleIndex;
        var panel = document.getElementById('fullscreen-subtitle-content');
        if (!panel) return;
        if (data.length > 0 && idx >= 0 && data[idx]) {
            var sub = data[idx];
            var timeStr = typeof formatTime === 'function' ? formatTime(sub.startTime) : '';
            panel.innerHTML =
                '<div class="subtitle-time">⏱️ ' + timeStr + '</div>' +
                '<div class="korean">' + highlightKoreanWords(sub.koreanText, idx) + '</div>' +
                '<div class="vietnamese">' + (sub.vietnameseText || '') + '</div>';
        } else if (data.length === 0) {
            panel.innerHTML = '⏳ Chưa tải phụ đề...';
        }
    }

    function updateVocabPanel() {
        var src = document.getElementById('vocab-info-display');
        var dst = document.getElementById('fullscreen-vocab-content');
        if (src && dst && src.innerHTML !== dst.innerHTML) dst.innerHTML = src.innerHTML;
    }

    function startSync() {
        if (fullscreenSyncInterval) clearInterval(fullscreenSyncInterval);
        fullscreenSyncInterval = setInterval(function () {
            if (!isFullscreenActive) return;
            updateSubtitlePanel();
            updateVocabPanel();
        }, 200);
    }

    function stopSync() {
        if (fullscreenSyncInterval) { clearInterval(fullscreenSyncInterval); fullscreenSyncInterval = null; }
    }

    window.enterFullscreenMode = function () {
        if (isFullscreenActive) return;
        isFullscreenActive = true;
        document.documentElement.classList.add('fullscreen-active');
        document.body.classList.add('fullscreen-active');

        var btn = document.getElementById('enter-fullscreen-btn');
        if (btn) btn.style.display = 'none';

        updateSubtitlePanel();
        updateVocabPanel();
        startSync();

        if (typeof stopReading === 'function') stopReading();
        if (window.youtubePlayer && typeof window.youtubePlayer.playVideo === 'function') {
            setTimeout(function () {
                if (window.youtubePlayer.getPlayerState() !== 1) window.youtubePlayer.playVideo();
            }, 400);
        }
    };

    window.exitFullscreenMode = function () {
        if (!isFullscreenActive) return;
        isFullscreenActive = false;
        document.documentElement.classList.remove('fullscreen-active');
        document.body.classList.remove('fullscreen-active');

        var btn = document.getElementById('enter-fullscreen-btn');
        if (btn) btn.style.display = 'block';

        stopSync();

        if (window.youtubePlayer && window.youtubePlayer.getPlayerState() === 1 && typeof startReading === 'function') {
            setTimeout(startReading, 500);
        }
    };

    /* Hook updateSubtitleDisplay để panel fullscreen sync tức thì */
    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('enter-fullscreen-btn').addEventListener('click', window.enterFullscreenMode);
        document.getElementById('fullscreen-close-btn').addEventListener('click', window.exitFullscreenMode);

        /* Override updateSubtitleDisplay */
        var origUpdate = window.updateSubtitleDisplay;
        if (typeof origUpdate === 'function') {
            window.updateSubtitleDisplay = function (index) {
                origUpdate(index);
                if (isFullscreenActive) updateSubtitlePanel();
            };
        }

        /* Override handleWordClick */
        var origClick = window.handleWordClick;
        if (typeof origClick === 'function') {
            window.handleWordClick = function (word, subtitleIndex) {
                origClick(word, subtitleIndex);
                if (isFullscreenActive) setTimeout(updateVocabPanel, 120);
            };
        }
    });

    /* ESC thoát fullscreen */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isFullscreenActive) window.exitFullscreenMode();
    });
})();
