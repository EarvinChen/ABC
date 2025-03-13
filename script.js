/* 新增：初始化全域 AudioContext 用於 iOS 音頻播放解鎖 */
let audioContext;
if (window.AudioContext || window.webkitAudioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

/* 新增：用於解鎖 iOS 上的音頻播放 (確保後續播放可觸發) */
function unlockAudio() {
    const dummyAudio = new Audio();
    dummyAudio.play().catch(() => {});
}
document.addEventListener('touchstart', unlockAudio, { once: true });

// 全域變數：用來區分切換方式 "button" 或 "swipe"
let lastSwitchMethod = "";

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

// 隨機顏色生成函數
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

// 更新顯示字母及背景
function updateLetter() {
    const letter = shuffledAlphabet[currentLetterIndex];
    const backgroundColor = getRandomColor();
    let textColor = getRandomColor();
    
    // 確保字母顏色與背景顏色對比足夠
