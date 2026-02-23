export const URL_API = "https://backend-u1p2.onrender.com";
export const TEST = false;

// --- FETCH WITH RETRY ---
export async function fetchWithRetry(url, options = {}, retries = 4) {
    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        // Lần đầu timeout 10s, các lần sau 60s (chờ server wake up)
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
            // Delay tăng dần: 3s → 6s → 12s
            const delay = 3000 * Math.pow(2, i);
            console.warn(`Retry ${i + 1}/${retries} sau ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// --- FETCH WITH AUTH ---
export async function fetchWithAuth(url, options = {}, retries = 4) {
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

            if (response.status === 401) throw new Error("Unauthorized");

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

// --- WARNING ---
let lastWarningTime = 0;
export function showWarning(...args) {
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
        animation: slideDown 0.3s ease-out;
    `;
    document.body.appendChild(warning);
    setTimeout(() => {
        warning.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => warning.remove(), 300);
    }, 3000);
}