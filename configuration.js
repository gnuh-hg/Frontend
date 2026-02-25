/* ── configuration.js ── */
window.Config = {
    URL_API: "https://backend-u1p2.onrender.com",
    TEST: false,
    _lastWarningTime: 0,
    _loadingCount: 0, // đếm số request đang chạy

    // --- LOADING ---
    showLoading() {
        this._loadingCount++;
        if (this._loadingTimer) return; // đang có timer rồi thì thôi
    
        this._loadingTimer = setTimeout(() => {
            if (this._loadingCount === 0) return; // xong rồi thì không hiện
            if (document.querySelector('.config-loading')) return;
        
            const overlay = document.createElement('div');
            overlay.className = 'config-loading';
            overlay.style.cssText = `
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.4);
                display: flex; align-items: center; justify-content: center;
                z-index: 99999;
            `;
            overlay.innerHTML = `
                <div style="
                    background: #1a1a20; border: 1px solid #27272a;
                    border-radius: 12px; padding: 20px 28px;
                    display: flex; align-items: center; gap: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                ">
                    <div style="
                        width: 18px; height: 18px; border-radius: 50%;
                        border: 2.5px solid #27272a; border-top-color: #6366f1;
                        animation: config-spin 0.8s linear infinite; flex-shrink: 0;
                    "></div>
                    <span style="font-size: 13px; font-weight: 500; color: #9494a0;">
                        Connecting...
                    </span>
                </div>
            `;
        
            if (!document.querySelector('#config-loading-style')) {
                const style = document.createElement('style');
                style.id = 'config-loading-style';
                style.textContent = `@keyframes config-spin { to { transform: rotate(360deg); } }`;
                document.head.appendChild(style);
            }
        
            document.body.appendChild(overlay);
        }, 500); // ← chờ 500ms mới hiện
    },
    
    hideLoading() {
        this._loadingCount = Math.max(0, this._loadingCount - 1);
        if (this._loadingCount > 0) return;
    
        // Hủy timer nếu chưa hiện kịp
        clearTimeout(this._loadingTimer);
        this._loadingTimer = null;
    
        document.querySelector('.config-loading')?.remove();
    },

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

    async fetchWithAuth(url, options = {}, retries = 4) {
        const token = localStorage.getItem('access_token');
        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        this.showLoading();

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
                    this.hideLoading();
                    localStorage.removeItem('access_token');
                    window.location.href = "/account/login.html";
                    return response;
                }

                if (!response.ok && i < retries - 1) {
                    throw new Error(`Server_Error_${response.status}`);
                }

                this.hideLoading();
                return response;

            } catch (error) {
                clearTimeout(timer);

                if (i === retries - 1) {
                    this.hideLoading(); // ← ẩn loading khi hết retry
                    this.showWarning("Connection error");
                    localStorage.removeItem('access_token');
                    window.location.href = "/account/login.html";
                    throw error;
                }

                const delay = 1000 * Math.pow(2, i);
                console.warn(`Lỗi: ${error.message}. Thử lại ${i + 1}/${retries} sau ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },

    // --- WARNING ---
    showWarning(...args) {
        const warning_context = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        const currentTime = Date.now();
        if (currentTime - this._lastWarningTime < 3000) return;
        this._lastWarningTime = currentTime;

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
        setTimeout(() => warning.remove(), 3000);
    }
};