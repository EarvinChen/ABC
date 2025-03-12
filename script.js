const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let shuffledAlphabet = shuffleArray([...alphabet]);  // 隨機打亂字母順序
let currentLetterIndex = 0;
let isFirstClick = true;  // 判斷是否是第一次點擊字母

const letterDisplay = document.getElementById("letter-display");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");

let voices = []; // 用來儲存可用的語音列表

// 等待語音列表加載完畢
speechSynthesis.onvoiceschanged = function() {
    voices = speechSynthesis.getVoices();
}

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

// 計算顏色的亮度（用來檢查對比度）
function getLuminance(color) {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;
    const a = [r, g, b].map(function (x) {
        x /= 255;
        return (x <= 0.03928) ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

// 判斷兩個顏色對比度是否足夠
function isHighContrast(textColor, backgroundColor) {
    const textLum = getLuminance(textColor);
    const backgroundLum = getLuminance(backgroundColor);
    const contrast = (Math.max(textLum, backgroundLum) + 0.05) / (Math.min(textLum, backgroundLum) + 0.05);
    return contrast > 4.5;  // 符合WCAG AA標準的對比度要求
}

// 更新顯示的字母
function updateLetter() {
    const letter = shuffledAlphabet[currentLetterIndex];
    const backgroundColor = getRandomColor();
    let textColor = getRandomColor();

    // 確保字母顏色和背景顏色有足夠的對比
    while (!isHighContrast(textColor, backgroundColor)) {
        textColor = getRandomColor();
    }

    letterDisplay.textContent = letter;
    letterDisplay.style.backgroundColor = backgroundColor;
    letterDisplay.style.color = textColor;
}

// 播放字母的發音
// 播放字母的音效
function playLetterSound(letter) {
    const audio = new Audio(`sounds/${letter.toLowerCase()}.mp3`); // 使用小寫字母對應音效
    audio.play();  // 播放音效
}

// 點擊測試按鈕的事件
document.getElementById("test-button").addEventListener("click", function() {
    playLetterSound('a');  // 播放 a.mp3
});


// 點擊字母區塊的事件
letterDisplay.addEventListener("click", () => {
    if (isFirstClick) {
        // 第一次點擊時，先唸出字母的發音
        playLetterSound(shuffledAlphabet[currentLetterIndex]);
        isFirstClick = false;  // 設定為不是第一次點擊
    } else {
        // 第二次點擊，切換到下一個字母
        currentLetterIndex = (currentLetterIndex + 1) % shuffledAlphabet.length;
        updateLetter();
        isFirstClick = true;  // 重置為第一次點擊
    }
});


// 上一個字母
prevButton.addEventListener("click", () => {
    if (currentLetterIndex > 0) {
        currentLetterIndex--;
    } else {
        // 循環到最後一個字母
        currentLetterIndex = shuffledAlphabet.length - 1;
    }
    updateLetter();
    isFirstClick = true;  // 重置為第一次點擊
});

// 下一個字母
nextButton.addEventListener("click", () => {
    if (currentLetterIndex < shuffledAlphabet.length - 1) {
        currentLetterIndex++;
    } else {
        // 循環到第一個字母
        currentLetterIndex = 0;
    }
    updateLetter();
    isFirstClick = true;  // 重置為第一次點擊
});

// 初始化遊戲
updateLetter();
