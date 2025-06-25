// Set key expiration time limit (in seconds)
const KEY_EXPIRE_SECONDS = 60 * 5; // 5 minutes, change as needed

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

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function generateKey(userId, cycleStart) {
    const length = 20;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    let seed = hashString(userId + "|" + cycleStart);
    for (let i = 0; i < length; i++) {
        let charIdx = (seed.charCodeAt(i % seed.length) + i) % chars.length;
        key += chars.charAt(charIdx);
    }
    return key;
}

function getCurrentCycleStart() {
    const now = Math.floor(Date.now() / 1000);
    return now - (now % KEY_EXPIRE_SECONDS);
}

function getKeyData() {
    const data = localStorage.getItem('phantom_generated_key_v3');
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

function saveKeyData(obj) {
    localStorage.setItem('phantom_generated_key_v3', JSON.stringify(obj));
}

function showKeyAndExpiry(key, expiresUnix) {
    document.getElementById('key-display').textContent = key;
    updateExpiresIn(expiresUnix);
}

function updateExpiresIn(expiresUnix) {
    const now = Math.floor(Date.now() / 1000);
    let secondsLeft = expiresUnix - now;
    const expiresDiv = document.getElementById('expires-in');
    if (secondsLeft <= 0) {
        expiresDiv.textContent = "Key expired. Refreshing…";
        setTimeout(() => location.reload(), 1000);
        return;
    }
    let min = Math.floor(secondsLeft / 60);
    let sec = secondsLeft % 60;
    expiresDiv.textContent = `Expires in: ${min}:${sec.toString().padStart(2, '0')}`;
    setTimeout(() => updateExpiresIn(expiresUnix), 1000);
}

window.onload = function() {
    const userId = getUserFingerprint();
    const cycleStart = getCurrentCycleStart();
    const expireAt = cycleStart + KEY_EXPIRE_SECONDS;

    let keyData = getKeyData();

    // Check if stored key is valid for this user and this cycle
    if (
        keyData &&
        keyData.userId === userId &&
        keyData.cycleStart === cycleStart &&
        keyData.expires === expireAt &&
        typeof keyData.key === "string"
    ) {
        showKeyAndExpiry(keyData.key, expireAt);
    } else {
        const key = generateKey(userId, cycleStart);
        saveKeyData({
            userId: userId,
            key: key,
            cycleStart: cycleStart,
            expires: expireAt
        });
        showKeyAndExpiry(key, expireAt);
    }
};
