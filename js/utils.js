function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
}

function formatTimeForSRT(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&]+)/,
        /(?:youtube\.com\/embed\/)([^?]+)/,
        /(?:youtube\.com\/v\/)([^?]+)/,
        /(?:youtu\.be\/)([^?]+)/,
        /(?:youtube\.com\/live\/)([^?]+)/
    ];
    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function waitForPlayer() {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkPlayer = () => {
            if (youtubePlayer && youtubePlayer.seekTo && youtubePlayer.setVolume) {
                resolve();
            } else if (Date.now() - startTime > 10000) {
                reject(new Error("YouTube player failed to initialize"));
            } else {
                setTimeout(checkPlayer, 100);
            }
        };
        checkPlayer();
    });
}

function waitForVoices() {
    return new Promise((resolve) => {
        if (speechSynthesis.getVoices().length > 0) {
            resolve();
        } else {
            speechSynthesis.onvoiceschanged = () => {
                speechSynthesis.onvoiceschanged = null;
                resolve();
            };
        }
    });
}
