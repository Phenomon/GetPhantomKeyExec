// Set key expiration time limit (in seconds)
const KEY_EXPIRE_SECONDS = 60 * 36000; // 5 minutes, change as needed

function getUserFingerprint() {
    let fp = [
        navigator.userAgent,
        navigator.language,
        window.screen.width,
        window.screen.height,
        window.screen.colorDepth,
    ].join('|');
    let seed = localStorage.getItem('phantom_key_user_seed');
    if (!seed) {
        seed = Math.random().toString(36).substr(2, 10);
        localStorage.setItem('phantom_key_user_seed', seed);
    }
    fp += '|' + seed;
    return fp;
}

function generateRandomKey(length = 20) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

function getCurrentCycleStart() {
    const now = Math.floor(Date.now() / 1000);
    return now - (now % KEY_EXPIRE_SECONDS);
}

function getKeyData() {
    const data = localStorage.getItem('phantom_generated_key_v4');
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

function saveKeyData(obj) {
    localStorage.setItem('phantom_generated_key_v4', JSON.stringify(obj));
}

function showKey(key) {
    document.getElementById('key-display').textContent = key;
}

function handleExpiration(expiresUnix) {
    const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        if (now >= expiresUnix) {
            clearInterval(interval);
            location.reload();
        }
    }, 1000);
}

window.onload = function() {
    const userId = getUserFingerprint();
    const cycleStart = getCurrentCycleStart();
    const expireAt = cycleStart + KEY_EXPIRE_SECONDS;

    let keyData = getKeyData();

    // If stored key is valid for this user and cycle, use it
    if (
        keyData &&
        keyData.userId === userId &&
        keyData.cycleStart === cycleStart &&
        keyData.expires === expireAt &&
        typeof keyData.key === "string"
    ) {
        showKey(keyData.key);
        handleExpiration(expireAt);
    } else {
        // Generate a new random key for this cycle and user
        const key = generateRandomKey(20);
        saveKeyData({
            userId: userId,
            key: key,
            cycleStart: cycleStart,
            expires: expireAt
        });
        showKey(key);
        handleExpiration(expireAt);
    }
};
