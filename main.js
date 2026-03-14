// 1. Generate floating hearts
const heartsContainer = document.getElementById('hearts-container');
const hearts = ['🤍', '🩷', '💖', '💗', '💓', '💕', '✨', '🎂', '🍰', '🧁'];
function createHeart() {
    const heart = document.createElement('div');
    heart.classList.add('floating-heart');
    heart.innerText = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = Math.random() * 5 + 8 + 's';
    heart.style.opacity = Math.random() * 0.5 + 0.3;
    heartsContainer.appendChild(heart);
    setTimeout(() => {
        heart.remove();
    }, 13000);
}
const isMobile = window.innerWidth <= 600;
setInterval(createHeart, isMobile ? 1500 : 800);

// Screens
const preStartScreen = document.getElementById('pre-start-screen');
const startScreen = document.getElementById('start-screen');

// Audio Context (Needs to be at the top)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gameScreen = document.getElementById('game-screen');
const winScreen = document.getElementById('win-screen');

// Start Screen Typewriter
const typeStartEl = document.getElementById('typewriter-start');
const startBtn = document.getElementById('start-btn');
const startMessages = [
    "Hello",
    "Hôm nay là một ngày đặc biệt",
    "T muốn m giúp t bắt những ngôi sao để tạo thành tên của m. ✨"
];

const cheerAudio = new Audio('/yay-group-of-kids-cheering.mp3');


function playCuteTypeSound() {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Switch to square wave and increase gain for a louder, clickier "mechanical" type sound
    osc.type = 'square';
    osc.frequency.setValueAtTime(450 + Math.random() * 100, audioCtx.currentTime); // randomize pitch slightly
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime); // Louder (was 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playClickSound() {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6

    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

async function typeWriter(element, lines) {
    element.innerHTML = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const p = document.createElement('p');
        p.style.margin = "0";
        element.appendChild(p);

        // Create span to hold text so we can add cursor to it
        const span = document.createElement('span');
        p.appendChild(span);

        for (let j = 0; j < line.length; j++) {
            const char = line.charAt(j);
            span.innerHTML += char;
            if (char !== ' ') playCuteTypeSound();
            await new Promise(r => setTimeout(r, 60));
        }

        // After line finishes, remove cursor styling from this line
        span.style.borderRight = "none";
        span.style.animation = "none";

        if (i < lines.length - 1) {
            await new Promise(r => setTimeout(r, 800));
            p.style.marginBottom = '10px';
        }
    }
}

// Global mic variables
let audioStream = null;
let micError = false;

// Init Start sequence
document.getElementById('open-gift-btn').addEventListener('click', async () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playClickSound(); // Add sound effect to open button

    // Unlock audio element on first user interaction
    cheerAudio.load();
    cheerAudio.play().then(() => {
        cheerAudio.pause();
        cheerAudio.currentTime = 0;
    }).catch(e => console.log("Audio unlock failed: ", e));

    // Request Mic Access early
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
        console.error("Mic error:", e);
        micError = true;
    }

    preStartScreen.classList.add('hidden');
    preStartScreen.classList.remove('active');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');

    setTimeout(async () => {
        await typeWriter(typeStartEl, startMessages);
        startBtn.classList.remove('hidden');
        startBtn.style.display = 'block';
    }, 500);
});

startBtn.addEventListener('click', () => {
    playClickSound(); // Add sound effect to start button
    startScreen.classList.add('hidden');
    startScreen.classList.remove('active');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active');
    startGame();
});


// Game Logic
const gameArea = document.getElementById('game-area');
const lettersNeeded = ['T', 'H', 'Ư']; // U collects as Ư
const collectedStatus = { 'T': false, 'H': false, 'Ư': false };
let collectedCount = 0;
let starInterval;
let gameActive = false;

const allLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'V', 'W', 'X', 'Y', 'Z', 'T', 'H', 'Ư', 'T', 'H', 'Ư', 'Ư'];

function createStar() {
    if (!gameActive) return;
    const star = document.createElement('div');
    star.classList.add('star');
    const randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)];
    const starText = document.createElement('span');
    starText.classList.add('star-text');
    starText.innerText = randomLetter;
    star.appendChild(starText);
    // ensure star doesn't fall out of bounds horizontally
    star.style.left = Math.random() * 80 + 10 + 'vw';
    const duration = Math.random() * 3 + 4; // 4-7s
    star.style.animationDuration = duration + 's';

    star.addEventListener('click', () => {
        if (!gameActive) return;
        playChime();
        star.classList.add('star-collected');
        checkLetter(randomLetter);
        setTimeout(() => { if (star.parentNode) star.remove(); }, 400);
    });

    gameArea.appendChild(star);
    setTimeout(() => {
        if (star.parentNode) star.remove();
    }, duration * 1000);
}

function startGame() {
    gameActive = true;
    starInterval = setInterval(createStar, isMobile ? 1000 : 700);
}

function checkLetter(letter) {
    if (lettersNeeded.includes(letter)) {
        if (!collectedStatus[letter]) {
            collectedStatus[letter] = true;
            collectedCount++;

            // UI update
            let boxId = '';
            if (letter === 'T') boxId = 'box-T';
            if (letter === 'H') boxId = 'box-H';
            if (letter === 'Ư') boxId = 'box-U';

            const box = document.getElementById(boxId);
            box.querySelector('.placeholder').classList.add('hidden');
            box.querySelector('.letter').classList.remove('hidden');
            // Slight delay for translation animation to kick in after removal of hidden
            setTimeout(() => {
                box.querySelector('.letter').classList.add('show');
            }, 10);

            if (collectedCount === 3) {
                gameActive = false;
                clearInterval(starInterval);
                setTimeout(winGame, 1000); // brief pause before win
            }
        }
    }
}

// Web Audio API for soft chime
function playChime() {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}

function playWinSound() {
    if (audioCtx.state === 'suspended') return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        }, i * 150);
    });
}


// Win Screen logic
const typeWinEl = document.getElementById('typewriter-win');
const winWord = document.getElementById('win-word');
const cakeContainer = document.getElementById('cake-container');
const winMessages = [
    "Happy Birthday Thư 20 tuổi🎂",
    "16/03/2006",
    "Chúc m một tuổi mới thật nhiều niềm vui, luôn xinh đẹp, hạnh phúc và luôn đạt điểm tốt ở Hust nhe!"
];

async function winGame() {
    gameScreen.classList.add('hidden');
    gameScreen.classList.remove('active');
    winScreen.classList.remove('hidden');
    winScreen.classList.add('active');

    playWinSound();

    // Start fireworks (using global confetti from CDN)
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);

    // Initial confetti pop
    window.confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });

    // Show THƯ
    setTimeout(() => {
        winWord.classList.remove('hidden');
        winWord.classList.add('show');
    }, 500);

    // Typewriter
    setTimeout(async () => {
        await typeWriter(typeWinEl, winMessages);
        cakeContainer.classList.remove('hidden');
        cakeContainer.style.display = 'block';
    }, 2000);
}

// Cake interaction
const cakeInstruction = document.getElementById('cake-instruction');
let candlesLit = false;

// Mic variables - shared across cycles
let micAudioCtx = null;
let micAnalyser = null;
let micMicrophone = null;
let micCheckBlowLoopId = null;
let lastLitTime = 0; // Prevent immediate blowout from click sound


function fallbackMic() {
    cakeInstruction.innerText = "Không mở mic được rùi, m bấm vào bánh để tắt nến nha! 🎂";
    // Allow clicking to blowout if Mic fails
    cakeContainer.addEventListener('click', blowOutCandles, { once: true });
}

function checkBlow() {
    if (!candlesLit || !micAnalyser) {
        if (micCheckBlowLoopId) cancelAnimationFrame(micCheckBlowLoopId);
        micCheckBlowLoopId = null;
        return;
    }

    // Grace period: don't check for 1500ms after lighting (more safety for mobile)
    // This ignores the sound of the click itself
    if (Date.now() - lastLitTime < 1500) {
        micCheckBlowLoopId = requestAnimationFrame(checkBlow);
        return;
    }

    const bufferLength = micAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    micAnalyser.getByteFrequencyData(dataArray);

    let maxVol = 0;
    for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxVol) maxVol = dataArray[i];
    }

    // Increased threshold slightly for mobile/noisy environments
    if (maxVol > 200) {
        blowOutCandles();
    } else {
        micCheckBlowLoopId = requestAnimationFrame(checkBlow);
    }
}

cakeContainer.onclick = async () => {
    if (!candlesLit) {
        // LIGHT CANDLES
        candlesLit = true;
        lastLitTime = Date.now(); // Set immediately to ignore current click noise

        // Cancel any ghost loops
        if (micCheckBlowLoopId) cancelAnimationFrame(micCheckBlowLoopId);
        micCheckBlowLoopId = null;

        document.querySelectorAll('.flame').forEach(flame => flame.classList.remove('off'));
        cakeInstruction.innerText = "Đang thắp nến... 🕯️";

        if (audioStream && !micError) {
            try {
                if (!micAudioCtx) {
                    micAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    micAnalyser = micAudioCtx.createAnalyser();
                    micAnalyser.fftSize = 256;
                    micMicrophone = micAudioCtx.createMediaStreamSource(audioStream);
                    micMicrophone.connect(micAnalyser);
                }
                if (micAudioCtx.state === 'suspended') await micAudioCtx.resume();

                setTimeout(() => {
                    cakeInstruction.innerText = "Giờ m hãy thổi vào mic để tắt nến nhé! 🌬️🎂";
                    cakeInstruction.style.animation = 'pulse 1.5s infinite';
                    if (!micCheckBlowLoopId) micCheckBlowLoopId = requestAnimationFrame(checkBlow);
                }, 200);

            } catch (e) {
                console.error("Mic error:", e);
                fallbackMicMode();
            }
        } else {
            fallbackMicMode();
        }
    } else {
        // Manual blowout if mic failed or user clicks while lit
        if (micError || !audioStream) {
            blowOutCandles();
        }
    }
};

function fallbackMicMode() {
    cakeInstruction.innerText = "Không mở mic được rùi, m bấm vào bánh để tắt nến nha! 🎂";
    micError = true;
}


function blowOutCandles() {
    if (!candlesLit) return;
    candlesLit = false;

    // Stop the mic check loop (don't stop audioStream so it can be reused)
    if (micCheckBlowLoopId) {
        cancelAnimationFrame(micCheckBlowLoopId);
        micCheckBlowLoopId = null;
    }

    document.querySelectorAll('.flame').forEach(flame => flame.classList.add('off'));

    // Play cheer sound - reset first so multiple plays work
    try {
        cheerAudio.pause();
        cheerAudio.currentTime = 0;
        cheerAudio.play().catch(() => { });
    } catch (e) { }

    cakeInstruction.innerText = "Yayy! 🎉 Mãi đỉnh lun - nhấn lại để thắp nến nữa nhé!";
    cakeInstruction.style.animation = 'none';

    window.confetti({ particleCount: 200, spread: 120, origin: { y: 0.7 } });
    playWinSound();
}
