export const URL_API = "https://backend-u1p2.onrender.com";
export const TEST = false;

// --- FETCH WITH RETRY ---
export async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

// --- FETCH WITH AUTH ---
export async function fetchWithAuth(url, options = {}, retries = 3) {
    const token = localStorage.getItem('access_token');
    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers }
            });

            if (response.status === 401) {
                window.location.href = "./account/login.html";
                throw new Error("Unauthorized");
            }

            return response;
        } catch (error) {
            if (error.message === "Unauthorized") throw error;
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000));
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