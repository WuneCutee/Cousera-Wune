// sidepanel.js - v4.5 Nâng cấp hiệu ứng tiến trình
const safeGet = (id) => document.getElementById(id);

const startBtn = safeGet('start-btn');
const slugInput = safeGet('course-slug');
const statusDisplay = safeGet('status-display');
const btnAll = safeGet('btn-all');
const toggles = [safeGet('skip-video'), safeGet('solve-quiz'), safeGet('read-supplement'), safeGet('solve-widget')];
const keyInputs = [safeGet('gemini-1'), safeGet('gemini-2'), safeGet('gemini-3'), safeGet('gemini-4')];

// 1. ALL TOGGLE LOGIC
btnAll.addEventListener('click', () => {
    const isAnyUnchecked = toggles.some(t => !t.checked);
    toggles.forEach(t => t.checked = isAnyUnchecked);
    btnAll.classList.toggle('active', isAnyUnchecked);
    btnAll.innerText = isAnyUnchecked ? "🌟 Tắt tất cả mục tiêu" : "🌟 Bật tất cả mục tiêu";
    saveConfig();
});

// 2. TỰ ĐỘNG NHẬN DIỆN KHÓA HỌC
function autoDetect() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.url?.includes('coursera.org/learn/')) {
            const slug = tab.url.match(/learn\/([^\/]+)/)?.[1];
            if (slug) {
                slugInput.value = slug;
                safeGet('course-name-display').innerText = tab.title.split('|')[0].trim();
            }
        }
    });
}
autoDetect();
chrome.tabs.onActivated.addListener(autoDetect);
chrome.tabs.onUpdated.addListener((id, info) => { if (info.status === 'complete') autoDetect(); });

// 3. LOGGER
function logStatus(text) {
    const line = document.createElement('div');
    line.className = 'log-line';
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    line.innerHTML = `<span style="color:#6272a4">[${time}]</span> ${text}`;
    statusDisplay.appendChild(line);
    statusDisplay.scrollTop = statusDisplay.scrollHeight;
}

// 4. TIẾN ĐỘ (HÀM ĐÃ NÂNG CẤP)
function updateProgress(percent) {
    const container = safeGet('progress-container');
    const fill = safeGet('progress-fill');
    const text = safeGet('percent-text');

    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        container.style.animation = "entryBounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    }

    const p = Math.min(Math.round(percent), 100);
    fill.style.width = p + '%';
    text.innerText = p + '%';

    if (p >= 100) {
        fill.style.background = 'linear-gradient(90deg, #50fa7b, #8be9fd)';
        text.innerText = 'DONE ✅';
    }
}

// 5. LƯU CẤU HÌNH
function saveConfig() {
    const mergedKeys = keyInputs.map(input => input.value.trim()).filter(k => k).join(',');
    const config = {
        slug: slugInput.value.trim(),
        skipVideo: safeGet('skip-video').checked,
        solveQuiz: safeGet('solve-quiz').checked,
        readSupplement: safeGet('read-supplement').checked,
        solveWidget: safeGet('solve-widget').checked
    };
    chrome.storage.local.set({ geminiKey: mergedKeys, config: config });
}

[...toggles, ...keyInputs, slugInput].forEach(el => el.addEventListener('input', saveConfig));

// 6. NÚT START
startBtn.addEventListener('click', () => {
    saveConfig();
    const slug = slugInput.value.trim();
    const keys = keyInputs.map(i => i.value.trim()).filter(k => k);
    
    if (!slug) return alert("Vui lòng nhập Course Slug!");
    if (safeGet('solve-quiz').checked && keys.length === 0) return alert("Vui lòng nhập ít nhất 1 API Key!");

    startBtn.disabled = true;
    startBtn.innerText = "⏳ ĐANG CHẠY...";
    
    chrome.storage.local.get(['config'], (data) => {
        chrome.runtime.sendMessage({ action: 'startAutomation', config: data.config });
    });
});

// LẮNG NGHE TIN NHẮN TỪ BACKGROUND
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'statusUpdate') logStatus(msg.text);
    if (msg.type === 'updateProgress') updateProgress(msg.percent);
    if (msg.type === 'automationFinished') {
        startBtn.disabled = false;
        startBtn.innerText = "🚀 START AUTOMATION";
    }
});

// LOAD DỮ LIỆU CŨ
chrome.storage.local.get(null, (d) => {
    if (d.geminiKey) {
        const keysArr = d.geminiKey.split(',');
        keyInputs.forEach((input, index) => { if (keysArr[index]) input.value = keysArr[index]; });
    }
    if (d.config) {
        slugInput.value = d.config.slug || '';
        safeGet('skip-video').checked = d.config.skipVideo;
        safeGet('solve-quiz').checked = d.config.solveQuiz;
        safeGet('read-supplement').checked = d.config.readSupplement;
        safeGet('solve-widget').checked = d.config.solveWidget;
    }
});