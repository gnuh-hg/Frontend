/* ── configuration.js ── */
// Tạo một object tổng để chứa tất cả
window.Config = {
    URL_API: "https://backend-u1p2.onrender.com",
    TEST: false,

    // --- FETCH WITH RETRY ---
    async fetchWithRetry(url, options = {}, retries = 4) {
        for (let i = 0; i < retries; i++) {
            const controller = new AbortController();
            const timeoutMs = i === 0 ? 10000 : 60000;
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                clearTimeout(timer);
                return response;
            } catch (error) {
                clearTimeout(timer);
                if (i === retries - 1) throw error;
                const delay = 3000 * Math.pow(2, i);
                console.warn(`Retry ${i + 1}/${retries} sau ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },

    // --- FETCH WITH AUTH ---
    async fetchWithAuth(url, options = {}, retries = 4) {
        const token = localStorage.getItem('access_token');
        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        for (let i = 0; i < retries; i++) {
            const controller = new AbortController();
            const timeoutMs = i === 0 ? 10000 : 60000;
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(url, {
                    ...options,
                    headers: { ...defaultHeaders, ...options.headers },
                    signal: controller.signal
                });
                clearTimeout(timer);
                if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    window.location.href = "/account/login.html"; // ← dùng đường dẫn tuyệt đối
                    throw new Error("Unauthorized");
                }
                return response;
            } catch (error) {
                clearTimeout(timer);
                if (error.message === "Unauthorized") throw error;
                if (i === retries - 1) throw error;
                const delay = 3000 * Math.pow(2, i);
                console.warn(`Retry ${i + 1}/${retries} sau ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
};

// --- WARNING (Để riêng hoặc gán vào Config đều được) ---
let lastWarningTime = 0;
window.showWarning = function(...args) {
    const warning_context = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    const currentTime = Date.now();
    if (currentTime - lastWarningTime < 3000) return;
    lastWarningTime = currentTime;

    const existingWarning = document.querySelector('.warning');
    if (existingWarning) existingWarning.remove();

    const warning = document.createElement('div');
    warning.className = 'warning';
    warning.textContent = warning_context;
    warning.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #ef4444; color: white; padding: 12px 24px;
        border-radius: 8px; font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
    `;
    document.body.appendChild(warning);
    setTimeout(() => {
        warning.remove();
    }, 3000);
};