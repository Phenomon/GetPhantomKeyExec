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
    // Optionally add a random local seed for more uniqueness, persisted in localStorage
    let seed = localStorage.getItem('phantom_key_user_seed');
    if (!seed) {
        seed = Math.random().toString(36).substr(2, 10);
        localStorage.setItem('phantom_key_user_seed', seed);
    }
    fp += '|' + seed;
    return fp;
}

function hashString(str) {
    // Simple hash for demo; in production use a better hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

function generateKey(userId, cycleStart) {
    const length = 20;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    // Mix userId hash and cycle start into key generation for user-uniqueness and time-boundedness
    let seed = hashString(userId + "|" + cycleStart);
    for (let i = 0; i < length; i++) {
        // Use char codes from the seed as a pseudo-randomizer
        let charIdx = (seed.charCodeAt(i % seed.length) + i) % chars.length;
        key += chars.charAt(charIdx);
    }
    return key;
}

function getCurrentCycleStart() {
    // Returns the Unix timestamp (in seconds) of the start of the current key cycle
    const now = Math.floor(Date.now() / 1000);
    return now - (now % KEY_EXPIRE_SECONDS);
}

function getKeyData(userId) {
    const data = localStorage.getItem('phantom_generated_key_v2');
    if (!data) return null;
    try {
        const parsed = JSON.parse(data);
        if (parsed.userId === userId) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

function saveKeyData(userId, key, cycleStart, expireAt) {
    localStorage.setItem('phantom_generated_key_v2', JSON.stringify({
        userId: userId,
        key: key,
        cycleStart: cycleStart,
        expires: expireAt
    }));
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

    let keyData = getKeyData(userId);

    // If no key stored, or it's for a different cycle, generate a new one for this cycle
    if (!keyData || keyData.cycleStart !== cycleStart) {
        const key = generateKey(userId, cycleStart);
        saveKeyData(userId, key, cycleStart, expireAt);
        showKeyAndExpiry(key, expireAt);
    } else {
        showKeyAndExpiry(keyData.key, keyData.expires);
    }
};
