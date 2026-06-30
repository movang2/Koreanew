# YoutubeStudy

Học tiếng Hàn qua video YouTube với phụ đề SRT, TTS và từ vựng.

## Cách dùng

Mở `index.html` trong trình duyệt — **không cần server**.

> ⚠️ Nếu dùng Chrome trên máy tính, cần mở qua local server (VD: Live Server trong VS Code) vì Chrome chặn ES modules từ `file://`.
> Firefox cho phép mở trực tiếp bằng `file://`.

## Cấu trúc thư mục

```
YoutubeStudy/
├── index.html              ← Giao diện chính
│
├── css/
│   ├── main.css            ← Layout tổng, body, container, video
│   ├── player.css          ← Nhóm nút điều khiển, cài đặt
│   ├── subtitle.css        ← Phụ đề, từ Hàn, highlight
│   ├── vocab.css           ← Từ vựng, lịch sử, vocab panel
│   ├── cloud.css           ← Panel đăng nhập & đồng bộ cloud
│   ├── tooltip.css         ← Tooltip tra từ nhanh
│   └── mobile.css          ← Responsive cho màn hình nhỏ
│
├── js/
│   ├── config.js           ← Biến toàn cục
│   ├── utils.js            ← Hàm tiện ích (formatTime, extractVideoId…)
│   ├── youtube.js          ← Load video, YouTube IFrame API
│   ├── subtitles.js        ← Đọc SRT, sync phụ đề, highlight
│   ├── subtitleTranslate.js← Dịch phụ đề qua Google Translate
│   ├── subtitleEditor.js   ← Gộp dòng, xóa ký tự, tải SRT
│   ├── tts.js              ← Toàn bộ TTS (đơn ngữ, song ngữ, từ vựng)
│   ├── vocab.js            ← Tra từ, tooltip, danh sách từ vựng
│   ├── notebooklm.js       ← Liên kết từ NotebookLM với phụ đề
│   ├── favorites.js        ← Phụ đề yêu thích
│   ├── history.js          ← Lịch sử xem video
│   ├── storage.js          ← Lưu/tải trạng thái, reset
│   ├── cloudSync.js        ← Firebase Auth + Firestore sync (ES module)
│   ├── tooltip.js          ← Tooltip UI và event listeners
│   └── app.js              ← Khởi tạo (window.onload)
│
└── assets/                 ← Ảnh, icon (nếu cần)
```

## Tính năng

- 🎬 Phát video YouTube với phụ đề SRT song ngữ (Hàn - Việt)
- 🔊 TTS tự động đọc phụ đề (Tiếng Việt hoặc Tiếng Hàn)
- 📖 Đọc từ vựng với tạm dừng video tự động
- 🔍 Tra từ ngay trong phụ đề, hiện tooltip hoặc mở Naver
- 📔 Liên kết từ NotebookLM với phụ đề
- ✂️ Gộp dòng SRT theo nhiều cách
- ☁️ Đồng bộ dữ liệu lên Firebase Cloud

## Thêm tính năng mới

| Muốn thêm | Tạo file |
|-----------|----------|
| AI dịch bằng Gemini | `js/subtitleTranslate.js` (sửa) hoặc `js/geminiTranslate.js` |
| OCR ảnh | `js/ocr.js` |
| Chat AI | `js/chat.js` |
| Flashcard | `js/flashcard.js` |
| Shadowing | `js/shadowing.js` |

Thêm `<script src="js/ten-file-moi.js"></script>` vào cuối `index.html` trước thẻ `</body>`.
