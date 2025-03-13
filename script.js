/* 新增：用於解鎖 iOS 上的音頻播放 (確保後續播放可觸發) */
function unlockAudio() {
    const dummyAudio = new Audio();
    dummyAudio.play().catch(() => {});
}
// 在第一次用戶觸摸時解鎖音頻，避免iOS限制
document.addEventListener('touchstart', unlockAudio, { once: true });

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

// 添加底線到字母顯示區域
letterDisplay.appendChild(countdownLine);

// 倒數計時相關變數
let countdownValue = 0;
let countdownInterval = null;
const countdownDuration = 3; // 倒計時總時長（秒）

// 觸摸事件相關變數
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
let isSwiping = false;  // 判斷是否為滑動事件

// 隨機打亂陣列的函數
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];  // 交換元素
    }
    return array;
}

// 隨機顏色生成
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 計算顏色亮度（用來檢查對比度）
function getLuminance(color) {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const a = [r, g, b].map(function(x) {
        x /= 255;
        return (x <= 0.03928) ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

// 判斷兩個顏色對比度是否足夠（符合 WCAG AA 標準）
function isHighContrast(textColor, backgroundColor) {
    const textLum = getLuminance(textColor);
    const backgroundLum = getLuminance(backgroundColor);
    const contrast = (Math.max(textLum, backgroundLum) + 0.05) / (Math.min(textLum, backgroundLum) + 0.05);
    return contrast > 4.5;
}

// 更新顯示字母
function updateLetter() {
    const letter = shuffledAlphabet[currentLetterIndex];
    const backgroundColor = getRandomColor();
    let textColor = getRandomColor();

    // 確保字母顏色與背景顏色對比足夠
    while (!isHighContrast(textColor, backgroundColor)) {
        textColor = getRandomColor();
    }

    // 更新字母及背景
    letterDisplay.textContent = letter;
    letterDisplay.style.backgroundColor = backgroundColor;
    letterDisplay.style.color = textColor;
    
    // 重新添加倒數底線（因為 textContent 會覆蓋子元素）
    letterDisplay.appendChild(countdownLine);
    countdownLine.style.width = "0%";
    // 設定倒數底線顏色與字母顏色一致
    countdownLine.style.backgroundColor = textColor;
}

// 播放字母音效（使用 Audio API 播放預先準備的 MP3 檔案）
function playLetterSound(letter) {
    const audio = new Audio(`sounds/${letter.toLowerCase()}.mp3`);  // 使用小寫字母對應音效
    audio.play();  // 播放音效
}

// 修改：將倒數計時結束時的處理邏輯獨立出來
function handleCountdownEnd() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    countdownLine.style.width = "0%";
    countdownTimer.textContent = "";
    
    // 播放當前字母音效
    playLetterSound(shuffledAlphabet[currentLetterIndex]);
}

// 開始倒數計時
function startCountdown() {
    // 如果已有倒數計時在運行，先停止它
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    countdownValue = countdownDuration;  // 初始化為3秒
    countdownTimer.textContent = "";  // 不顯示倒數數字
    countdownLine.style.width = "100%";  // 底線初始寬度為100%
    
    const updateFrequency = 100;  // 每100毫秒更新一次底線寬度（平滑動畫）
    const steps = countdownDuration * (1000 / updateFrequency);  // 總步數
    let currentStep = 0;
    
    countdownInterval = setInterval(() => {
        currentStep++;
        
        // 更新倒數底線寬度
        const percentRemaining = 100 - (currentStep / steps * 100);
        countdownLine.style.width = `${percentRemaining}%`;
        
        // 每秒更新內部倒數計時值（不顯示）
        if (currentStep % (1000 / updateFrequency) === 0) {
            countdownValue--;
        }
        
        // 倒數結束時，調用結束處理函數
        if (currentStep >= steps) {
            handleCountdownEnd();
        }
    }, updateFrequency);
}

// 下一個字母函數
function goToNextLetter() {
    // 停止正在運行的倒數計時
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownTimer.textContent = "";
        countdownLine.style.width = "0%";
    }
    
    // 切換至下一個字母（循環）
    if (currentLetterIndex < shuffledAlphabet.length - 1) {
        currentLetterIndex++;
    } else {
        currentLetterIndex = 0;
    }
    updateLetter();
    
    // 如果倒數開關開啟，重新啟動倒數
    if (countdownToggle.checked) {
        startCountdown();
    }
    isFirstClick = true;  // 重置點擊狀態
}

// 上一個字母函數
function goToPrevLetter() {
    // 停止正在運行的倒數計時
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownTimer.textContent = "";
        countdownLine.style.width = "0%";
    }
    
    // 切換至上一個字母（循環）
    if (currentLetterIndex > 0) {
        currentLetterIndex--;
    } else {
        currentLetterIndex = shuffledAlphabet.length - 1;
    }
    updateLetter();
    
    // 如果倒數開關開啟，重新啟動倒數
    if (countdownToggle.checked) {
        startCountdown();
    }
    isFirstClick = true;  // 重置點擊狀態
}

// 點擊字母區塊事件處理
letterDisplay.addEventListener("click", (e) => {
    // 若為滑動事件後觸發的點擊，則不處理
    if (isSwiping) {
        isSwiping = false;
        return;
    }
    
    // 若倒數開關開啟，則讓倒數計時控制發音（不直接處理點擊）
    if (countdownToggle.checked) {
        return;
    }
    
    if (isFirstClick) {
        // 第一次點擊時，播放當前字母的音效
        playLetterSound(shuffledAlphabet[currentLetterIndex]);
        isFirstClick = false;
    } else {
        // 第二次點擊時，切換到下一個字母
        goToNextLetter();
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
    handleSwipe();
});

// 處理滑動手勢
function handleSwipe() {
    const swipeThreshold = 50;  // 滑動閾值，需大於此值才觸發
    const swipeDistance = touchEndX - touchStartX;
    const verticalDistance = Math.abs(touchEndY - touchStartY);
    
    // 確保是水平滑動（水平移動距離大於垂直移動距離）
    if (Math.abs(swipeDistance) > verticalDistance) {
        if (Math.abs(swipeDistance) > swipeThreshold) {
            isSwiping = true;  // 標記為滑動事件
            
            if (swipeDistance > 0) {
                // 右滑 - 切換到上一個字母
                goToPrevLetter();
            } else {
                // 左滑 - 切換到下一個字母
                goToNextLetter();
            }
        }
    }
}

// 倒數計時開關變更事件
countdownToggle.addEventListener("change", () => {
    if (countdownToggle.checked) {
        // 開啟倒數時，開始倒數計時
        startCountdown();
    } else {
        // 關閉倒數時，停止倒數計時並重置底線
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            countdownLine.style.width = "0%";
        }
    }
});

// 上一個字母按鈕事件
prevButton.addEventListener("click", goToPrevLetter);

// 下一個字母按鈕事件
nextButton.addEventListener("click", goToNextLetter);

// 初始化遊戲，顯示第一個字母
updateLetter();