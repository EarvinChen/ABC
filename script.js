/* 初始化全域 AudioContext（所有設備均採用此流程） */
let audioContext;
if (window.AudioContext || window.webkitAudioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

/* 用於解鎖音頻播放（確保後續播放可觸發） */
function unlockAudio() {
    const dummyAudio = new Audio();
    dummyAudio.play().catch(() => {});
}
document.addEventListener('touchstart', unlockAudio, { once: true });

// 全域變數：用來區分切換方式，"button" 或 "swipe"
let lastSwitchMethod = "";

// 新增：倒數自然完成標記，預設為 false
let countdownCompleted = false;

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let shuffledAlphabet = shuffleArray([...alphabet]);  // 隨機打亂字母順序
let currentLetterIndex = 0;
let isFirstClick = true;  // 判斷是否是第一次點擊字母

const letterDisplay = document.getElementById("letter-display");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const countdownToggle = document.getElementById("countdown-toggle");
const countdownTimer = document.getElementById("countdown-timer");

// 創建倒數底線元素
let countdownLine = document.createElement("div");
countdownLine.className = "countdown-line";
countdownLine.style.width = "0%"; // 初始寬度為0

// 添加倒數底線到字母顯示區塊
letterDisplay.appendChild(countdownLine);

// 倒數計時相關變數
let countdownValue = 0;
let countdownInterval = null;
const countdownDuration = 3; // 倒計時總時長（秒）

// 觸摸事件相關變數
let touchStartX = 0, touchEndX = 0, touchStartY = 0, touchEndY = 0;
let isSwiping = false;  // 判斷是否為滑動事件

// 隨機打亂陣列的函數
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];  // 交換元素
    }
    return array;
}

// 隨機生成顏色
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 計算顏色亮度（用於檢查對比度）
function getLuminance(color) {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff, g = (rgb >> 8) & 0xff, b = (rgb >> 0) & 0xff;
    const a = [r, g, b].map(x => {
        x /= 255;
        return (x <= 0.03928) ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

// 判斷兩個顏色對比度是否足夠（符合 WCAG AA 標準）
function isHighContrast(textColor, backgroundColor) {
    const textLum = getLuminance(textColor), backgroundLum = getLuminance(backgroundColor);
    const contrast = (Math.max(textLum, backgroundLum) + 0.05) / (Math.min(textLum, backgroundLum) + 0.05);
    return contrast > 4.5;
}

// 更新顯示字母及背景
function updateLetter() {
    // 重置倒數完成標記
    countdownCompleted = false;
    
    const letter = shuffledAlphabet[currentLetterIndex];
    const backgroundColor = getRandomColor();
    let textColor = getRandomColor();
    
    // 確保字母顏色與背景顏色對比足夠
    while (!isHighContrast(textColor, backgroundColor)) {
        textColor = getRandomColor();
    }
    
    // 更新字母與背景顏色
    letterDisplay.textContent = letter;
    letterDisplay.style.backgroundColor = backgroundColor;
    letterDisplay.style.color = textColor;
    
    // 重新添加倒數底線（因 textContent 會覆蓋子元素）
    letterDisplay.appendChild(countdownLine);
    countdownLine.style.width = "0%";
    // 設定倒數底線顏色與字母顏色一致
    countdownLine.style.backgroundColor = textColor;
    
    // 若倒數開關開啟，則開始倒數計時
    if (countdownToggle.checked) {
        startCountdown();
    }
}

// 播放字母音效（使用 Audio API 播放預先準備的 MP3 檔案）
function playLetterSound(letter) {
    const audio = new Audio(`sounds/${letter.toLowerCase()}.mp3`);
    return audio.play();
}

// 當倒數自然完成時的處理：僅設定倒數完成標記，等待用戶點擊
function handleCountdownEnd() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    countdownLine.style.width = "0%";
    countdownTimer.textContent = "";
    
    // 設定倒數完成標記，等待用戶點擊觸發音效
    countdownCompleted = true;
}

// 開始倒數計時
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    countdownValue = countdownDuration;
    countdownTimer.textContent = "";
    countdownLine.style.width = "100%";
    
    const updateFrequency = 100; // 每100毫秒更新一次
    const steps = countdownDuration * (1000 / updateFrequency);
    let currentStep = 0;
    
    countdownInterval = setInterval(() => {
        currentStep++;
        const percentRemaining = 100 - (currentStep / steps * 100);
        countdownLine.style.width = `${percentRemaining}%`;
        
        if (currentStep % (1000 / updateFrequency) === 0) {
            countdownValue--;
        }
        
        if (currentStep >= steps) {
            handleCountdownEnd();
        }
    }, updateFrequency);
}

// 下一個字母函數
function goToNextLetter() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownTimer.textContent = "";
        countdownLine.style.width = "0%";
    }
    
    currentLetterIndex = (currentLetterIndex < shuffledAlphabet.length - 1)
                         ? currentLetterIndex + 1
                         : 0;
    updateLetter();
    
    // 若倒數開關開啟且切換方式為按鈕，自動重新啟動倒數
    if (countdownToggle.checked && lastSwitchMethod === "button") {
        startCountdown();
    }
    isFirstClick = true;
    countdownCompleted = false;
}

// 上一個字母函數
function goToPrevLetter() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownTimer.textContent = "";
        countdownLine.style.width = "0%";
    }
    
    currentLetterIndex = (currentLetterIndex > 0)
                         ? currentLetterIndex - 1
                         : shuffledAlphabet.length - 1;
    updateLetter();
    
    if (countdownToggle.checked && lastSwitchMethod === "button") {
        startCountdown();
    }
    isFirstClick = true;
    countdownCompleted = false;
}

// 點擊字母區塊事件處理
letterDisplay.addEventListener("click", (e) => {
    if (isSwiping) {
        isSwiping = false;
        return;
    }
    
    // 當倒數開關開啟時：
    if (countdownToggle.checked) {
        if (countdownInterval) {
            // 用戶點擊中斷倒數，立即中斷並播放音效
            clearInterval(countdownInterval);
            countdownInterval = null;
            countdownLine.style.width = "0%";
            countdownTimer.textContent = "";
            playLetterSound(shuffledAlphabet[currentLetterIndex]).catch(() => {});
            countdownCompleted = false;
        } else if (countdownCompleted) {
            // 倒數自然完成後，等待用戶點擊觸發音效
            playLetterSound(shuffledAlphabet[currentLetterIndex]).catch(() => {});
            countdownCompleted = false;
        }
        return;
    }
    
    // 若倒數開關關閉時，處理一般點擊事件
    if (!countdownToggle.checked) {
        if (isFirstClick) {
            playLetterSound(shuffledAlphabet[currentLetterIndex]).catch(() => {});
            isFirstClick = false;
        } else {
            goToNextLetter();
        }
    }
});

// 觸摸開始事件：記錄觸摸起始位置並重置滑動標記
letterDisplay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    isSwiping = false;
});

// 觸摸結束事件：記錄觸摸結束位置並處理滑動手勢
letterDisplay.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe(e);
});

// 處理滑動手勢
function handleSwipe(e) {
    const swipeThreshold = 50;  // 滑動閾值
    const swipeDistance = touchEndX - touchStartX;
    const verticalDistance = Math.abs(touchEndY - touchStartY);
    
    if (Math.abs(swipeDistance) > verticalDistance && Math.abs(swipeDistance) > swipeThreshold) {
        isSwiping = true;
        lastSwitchMethod = "swipe";  // 設定切換方式為滑動
        
        if (swipeDistance > 0) {
            goToPrevLetter();
        } else {
            goToNextLetter();
        }
        // 防止隨後的點擊事件影響倒數（僅適用於 iOS）
        e.preventDefault();
    }
}

// 按鈕切換事件：設定切換方式為按鈕
prevButton.addEventListener("click", () => {
    lastSwitchMethod = "button";
    goToPrevLetter();
});
nextButton.addEventListener("click", () => {
    lastSwitchMethod = "button";
    goToNextLetter();
});

// 倒數計時開關變更事件
countdownToggle.addEventListener("change", () => {
    if (countdownToggle.checked) {
        startCountdown();
    } else {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            countdownLine.style.width = "0%";
        }
    }
});

// 初始化遊戲，顯示第一個字母
updateLetter();
