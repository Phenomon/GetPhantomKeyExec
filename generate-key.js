// Set key expiration time limit (in seconds)
const KEY_EXPIRE_SECONDS = 60 * 5; // 5 minutes, change as needed

// Generate a "user fingerprint" for uniqueness (browser+platform+random seed)
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

function generateKey(userId) {
    const length = 20;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    // Mix userId hash into key generation for user-uniqueness
    let seed = hashString(userId + Date.now() + Math.random());
    for (let i = 0; i < length; i++) {
        // Use char codes from the seed as a pseudo-randomizer
        let charIdx = (seed.charCodeAt(i % seed.length) + Math.floor(Math.random() * chars.length)) % chars.length;
        key += chars.charAt(charIdx);
    }
    return key;
}

function saveKeyForUser(userId, key, expiryUnix) {
    localStorage.setItem('phantom_generated_key', JSON.stringify({
        userId: userId,
        key: key,
        expires: expiryUnix
    }));
}

function getKeyForUser(userId) {
    const data = localStorage.getItem('phantom_generated_key');
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

function showKeyAndExpiry(key, expiresUnix) {
    document.getElementById('key-display').textContent = key;
    updateExpiresIn(expiresUnix);
}

function updateExpiresIn(expiresUnix) {
    const now = Math.floor(Date.now() / 1000);
    let secondsLeft = expiresUnix - now;
    const expiresDiv = document.getElementById('expires-in');
    if (secondsLeft <= 0) {
        expiresDiv.textContent = "Key expired. Refresh to generate a new key.";
        document.getElementById('key-display').textContent = "Key expired.";
        return;
    }
    let min = Math.floor(secondsLeft / 60);
    let sec = secondsLeft % 60;
    expiresDiv.textContent = `Expires in: ${min}:${sec.toString().padStart(2, '0')}`;
    setTimeout(() => updateExpiresIn(expiresUnix), 1000);
}

window.onload = function() {
    const userId = getUserFingerprint();
    let keyData = getKeyForUser(userId);
    const now = Math.floor(Date.now() / 1000);
    if (keyData && keyData.expires > now) {
        showKeyAndExpiry(keyData.key, keyData.expires);
    } else {
        const key = generateKey(userId);
        const expires = now + KEY_EXPIRE_SECONDS;
        saveKeyForUser(userId, key, expires);
        showKeyAndExpiry(key, expires);
    }
};
