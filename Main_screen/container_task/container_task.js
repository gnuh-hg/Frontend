import * as Config from '../../constants.js';

document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container-task');
    let projectId = null;
    let nameProject = null;
    let isRedirecting = false;

    document.addEventListener('projectSelected', function(e) {
        projectId = e.detail.id;
        nameProject = e.detail.name;

        container.querySelector('h1 p').innerHTML = nameProject;
        loadData();
    });

    // Hàm hiển thị cảnh báo
    let lastWarningTime = 0;
    function showWarning(warning_context) {
        const currentTime = Date.now();
        if (currentTime - lastWarningTime < 3000) return;
        lastWarningTime = currentTime;

        // Tạo tooltip cảnh báo
        const existingWarning = document.querySelector('.warning');
        if (existingWarning) existingWarning.remove();

        const warning = document.createElement('div');
        warning.className = 'warning';
        warning.textContent = warning_context;
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ef4444;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideDown 0.3s ease-out;
        `;

        document.body.appendChild(warning);

        // Tự động ẩn sau 3 giây
        setTimeout(() => {
            warning.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => warning.remove(), 300);
        }, 3000);
    }

    async function fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('access_token');
        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const response = await fetch(url, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });

        if (response.status === 401) {
            if (!isRedirecting) {  // ✅ Thêm check này
                isRedirecting = true;
                window.location.href = "./Account/login.html";
                showWarning("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
            }
            throw new Error("Unauthorized"); // Ngăn code tiếp tục chạy
        }
        
        return response;
    }

    async function loadData() {
        try {
            const response = await fetchWithAuth(`${Config.URL_API}/project/${projectId}/items`);
            if (!response.ok) {
                showWarning("Không thể tải dữ liệu");
                return;
            }

            let items = await response.json();
            items.forEach(item => renderItem(item));
        } catch (err) {
            showWarning("Lỗi khi load dữ liệu");
        }
    }

    function renderItem(item) {
        let progress;
        const start = new Date(item.start_date);
        const due = new Date(item.due_date);
        const now = new Date();
        
        if (isNaN(start.getTime()) || isNaN(due.getTime())) progress = 0;
        if (now < start) progress = 0;
        else if (now > due) progress = 100;
        else {
            const totalMs = due - start;
            const passedMs = now - start;
            const percentage = (passedMs / totalMs) * 100;
            progress = Math.round(percentage);
        }

        const html = `
            <div class="task ${item.priority}">
              <div class="task-header">
                <div class="task-name">${item.name}</div>
                <button class="btn-done">Done</button>
              </div>

              <div class="task-deadline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="5" width="16" height="16" rx="2" stroke="#6B7280" stroke-width="2" fill="white"/>
                  <line x1="4" y1="9" x2="20" y2="9" stroke="#6B7280" stroke-width="2"/>
                  <line x1="8" y1="3" x2="8" y2="6" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
                  <line x1="16" y1="3" x2="16" y2="6" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>Due: ${item.due_date}</span>
              </div>

              <div class="task-progress">
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-percent">${progress}%</span>
              </div>
            </div>
        `;
        const wrapper = container.querySelector('.task-list');
        wrapper.insertAdjacentHTML('beforeend', html);
        attachEvents(wrapper.lastElementChild);
    }

    function attachEvents(item){
        //Nút done
        item.querySelector('.task-header button').addEventListener('click', function(e) {
            e.stopPropagation();
            if (item.classList.contains('completed')) return;

            item.classList.add('completed');
            const progressBar = item.querySelector('.progress-bar-fill');
            const progressPercent = item.querySelector('.progress-percent');

            if (progressBar) progressBar.style.width = '100%';
            if (progressPercent) progressPercent.textContent = '100%';

            this.textContent = '✓ Done';
        });

        const panel = document.querySelector('.task-detail-panel');
        item.addEventListener('click', (e) => {
            if (!panel) return;
            panel.classList.add('active');
        })
    }

    container.querySelector('h1 button').addEventListener('click', async (e) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetchWithAuth(`${Config.URL_API}/project/${projectId}/items`, {
                method: 'POST',
                body: JSON.stringify({
                    name: '',
                    priority: 'medium',
                    start_date: today,
                    due_date: today,
                    time_spent_minutes: 0
                })
            });
            
            if (response.ok) {
                const item = await response.json();
                renderItem(item);
            } else {
                const errorData = await response.json();
                showWarning(`Không thể tạo mục mới: ${errorData.detail || 'Lỗi không xác định'}`);
            }
        } catch (err) {
            showWarning('Lỗi khi tạo task');
        }
    });

    const closeBtn = document.querySelector('.btn-close-detail');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const panel = document.querySelector('.task-detail-panel');
            if (!panel) return;
            panel.classList.remove('active');
        });
    }
});