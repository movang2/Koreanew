import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC3ArgRBdzrj-Njnq6A9KB--9LT45LUNJ8",
    authDomain: "yt-srt-sync.firebaseapp.com",
    projectId: "yt-srt-sync",
    storageBucket: "yt-srt-sync.firebasestorage.app",
    messagingSenderId: "64219190974",
    appId: "1:64219190974:web:ae6ca30879b9c654d4b0ef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

async function checkCloudData(user) {
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
            const data = snap.data();
            const lastSync = data.lastSync ? new Date(data.lastSync).toLocaleString('vi-VN') : 'Không rõ';
            const dataStr = JSON.stringify(data.localStorageData || {});
            const sizeKB = (dataStr.length / 1024).toFixed(2);
            document.getElementById('lastSyncInfo').innerHTML = `Lần đồng bộ cuối: ${lastSync}`;
            document.getElementById('dataSizeInfo').innerHTML = `Dung lượng: ${sizeKB} KB`;
            document.getElementById('syncStatusMain').innerHTML = `✅ Đã đăng nhập. Có ${Object.keys(data.localStorageData || {}).length} mục dữ liệu.`;
        } else {
            document.getElementById('lastSyncInfo').innerHTML = 'Lần đồng bộ cuối: Chưa có dữ liệu';
            document.getElementById('dataSizeInfo').innerHTML = 'Dung lượng: 0 KB';
        }
    } catch (error) {
        console.error("Lỗi kiểm tra cloud:", error);
    }
}

window.uploadToCloud = async function() {
    const user = auth.currentUser;
    if (!user) { alert('Vui lòng đăng nhập!'); return; }
    try {
        document.getElementById('syncStatusMain').innerHTML = '⏳ Đang upload...';
        const allData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            allData[k] = localStorage.getItem(k);
        }
        await setDoc(doc(db, "users", user.uid), { localStorageData: allData, lastSync: new Date().toISOString(), userEmail: user.email });
        document.getElementById('syncStatusMain').innerHTML = '✅ Upload thành công!';
        alert("📤 Upload dữ liệu lên cloud thành công!");
        checkCloudData(user);
    } catch (error) {
        document.getElementById('syncStatusMain').innerHTML = '❌ Lỗi: ' + error.message;
        alert('❌ Lỗi upload: ' + error.message);
    }
};

window.downloadFromCloud = async function() {
    const user = auth.currentUser;
    if (!user) { alert('Vui lòng đăng nhập!'); return; }
    if (!confirm('⚠️ Tải dữ liệu từ cloud sẽ GHI ĐÈ dữ liệu hiện tại. Tiếp tục?')) return;
    try {
        document.getElementById('syncStatusMain').innerHTML = '⏳ Đang tải...';
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) { document.getElementById('syncStatusMain').innerHTML = '⚠️ Không có dữ liệu'; alert("Không có dữ liệu trên cloud"); return; }
        const data = snap.data().localStorageData || {};
        if (Object.keys(data).length === 0) { alert("Dữ liệu trên cloud trống!"); return; }
        localStorage.clear();
        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
        document.getElementById('syncStatusMain').innerHTML = '✅ Tải thành công! Đang tải lại...';
        alert("📥 Tải thành công! Trang sẽ tải lại.");
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        document.getElementById('syncStatusMain').innerHTML = '❌ Lỗi: ' + error.message;
        alert('❌ Lỗi download: ' + error.message);
    }
};

window.deleteCloudData = async function() {
    const user = auth.currentUser;
    if (!user) { alert('Vui lòng đăng nhập!'); return; }
    if (!confirm('⚠️⚠️⚠️ XÓA TOÀN BỘ dữ liệu trên cloud? KHÔNG THỂ HOÀN TÁC!')) return;
    try {
        document.getElementById('syncStatusMain').innerHTML = '⏳ Đang xóa...';
        await setDoc(doc(db, "users", user.uid), { localStorageData: {}, lastSync: new Date().toISOString(), userEmail: user.email });
        document.getElementById('syncStatusMain').innerHTML = '✅ Đã xóa dữ liệu cloud';
        alert('🗑️ Đã xóa toàn bộ dữ liệu cloud!');
        checkCloudData(user);
    } catch (error) {
        document.getElementById('syncStatusMain').innerHTML = '❌ Lỗi: ' + error.message;
        alert('❌ Lỗi xóa: ' + error.message);
    }
};

document.getElementById('loginBtnMain').onclick = async () => {
    try { await signInWithPopup(auth, provider); }
    catch (error) { alert('❌ Lỗi đăng nhập: ' + error.message); }
};

document.getElementById('logoutBtnMain').onclick = async () => {
    await signOut(auth);
};

onAuthStateChanged(auth, (user) => {
    document.getElementById('loginBtnMain').style.display = user ? 'none' : 'inline-block';
    document.getElementById('logoutBtnMain').style.display = user ? 'inline-block' : 'none';
    document.getElementById('uploadBtn').disabled = !user;
    document.getElementById('downloadBtn').disabled = !user;
    document.getElementById('deleteCloudBtn').disabled = !user;
    if (user) {
        document.getElementById('userEmailDisplay').textContent = user.email;
        if (user.photoURL) { document.getElementById('userAvatar').src = user.photoURL; document.getElementById('userAvatar').style.display = 'inline-block'; }
        document.getElementById('syncStatusMain').innerHTML = '✅ Đã đăng nhập. Đang kiểm tra dữ liệu...';
        checkCloudData(user);
    } else {
        document.getElementById('userEmailDisplay').textContent = '';
        document.getElementById('userAvatar').style.display = 'none';
        document.getElementById('syncStatusMain').innerHTML = '⚡ Chưa đăng nhập';
        document.getElementById('lastSyncInfo').innerHTML = 'Lần đồng bộ cuối: Chưa có';
        document.getElementById('dataSizeInfo').innerHTML = 'Dung lượng: 0 KB';
    }
});
