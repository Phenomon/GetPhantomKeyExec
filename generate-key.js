function generateKey() {
    const length = 20;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

function saveKey(key) {
    try {
        localStorage.setItem('phantom_generated_key', key);
        return true;
    } catch (e) {
        return false;
    }
}

window.onload = function() {
    let key = generateKey();
    document.getElementById('key-display').textContent = key;
    if (saveKey(key)) {
        document.getElementById('saved-message').textContent = "Key saved locally!";
    } else {
        document.getElementById('saved-message').textContent = "Failed to save key.";
    }
};
