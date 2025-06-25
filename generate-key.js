function generateKey() {
    const length = 20;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('key-display').textContent = key;
}

// Generate the key as soon as the page loads
window.onload = generateKey;
