import * as Config from '../../configuration.js';

document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container-task');
    let projectId = null;
    let nameProject = null;
    let isRedirecting = false;
    document.querySelector('.task-detail-panel').classList.add('active');
    // Ẩn h1 và hiện empty state "chưa chọn project" lúc khởi tạo
    if (!Config.TEST) {
        container.querySelector('h1').style.display = 'none';
        showEmptyState('noProject');
    } else {
        showEmptyState('noTask');
    }

    document.addEventListener('projectSelected', function(e) {
        projectId = e.detail.id;
        nameProject = e.detail.name;

        container.querySelector('h1').style.display = '';
        container.querySelector('h1 p').innerHTML = nameProject;
        loadData();
    });

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
            if (!isRedirecting && !Config.TEST) {
                isRedirecting = true;
                window.location.href = "./Account/login.html";
                showWarning("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
            }
            throw new Error("Unauthorized");
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
            document.querySelectorAll('.task').forEach(el => el.remove());
            let items = await response.json();
            if (items.length === 0) {
                showEmptyState('noTask');
            } else {
                hideEmptyState();
                items.forEach(item => renderItem(item));
            }
        } catch (err) {
            showWarning("Lỗi khi load dữ liệu");
        }
    }

    function showEmptyState(type) {
        container.querySelector('.empty-state')?.remove();

        const cfg = type === 'noProject'
            ? {
                title: 'No project selected',
                desc: 'Select a project from the left sidebar to get started',
                svg: `
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="tGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <g transform="translate(100, 95)">
                            <rect x="-40" y="-32" width="80" height="64" rx="8"
                                  fill="none" stroke="url(#tGrad1)" stroke-width="3.5"
                                  stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="-24" y1="-10" x2="24" y2="-10"
                                  stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" opacity="0.35"/>
                            <line x1="-24" y1="2" x2="24" y2="2"
                                  stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" opacity="0.35"/>
                            <line x1="-24" y1="14" x2="10" y2="14"
                                  stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" opacity="0.2"/>
                        </g>
                        <!-- Arrow pointing left -->
                        <circle cx="68" cy="115" r="16" fill="#6366f1"/>
                        <polyline points="73,108 63,115 73,122"
                                  fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`
            }
            : {
                title: 'No tasks yet',
                desc: 'Click "New task" above to create your first task',
                svg: `
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="tGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <g transform="translate(100, 95)">
                            <rect x="-40" y="-32" width="80" height="64" rx="8"
                                  fill="none" stroke="url(#tGrad2)" stroke-width="3.5"
                                  stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="-24" y1="-10" x2="24" y2="-10"
                                  stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" opacity="0.35"/>
                            <line x1="-24" y1="2" x2="24" y2="2"
                                  stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" opacity="0.35"/>
                            <line x1="-24" y1="14" x2="10" y2="14"
                                  stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" opacity="0.2"/>
                        </g>
                        <!-- Plus badge -->
                        <circle cx="128" cy="115" r="16" fill="#6366f1"/>
                        <line x1="128" y1="106" x2="128" y2="124"
                              stroke="white" stroke-width="3" stroke-linecap="round"/>
                        <line x1="119" y1="115" x2="137" y2="115"
                              stroke="white" stroke-width="3" stroke-linecap="round"/>
                    </svg>`
            };

        const el = document.createElement('div');
        el.className = 'empty-state';
        el.innerHTML = `${cfg.svg}<h3>${cfg.title}</h3><p>${cfg.desc}</p>`;
        container.querySelector('.task-list').appendChild(el);
    }

    function hideEmptyState() {
        container.querySelector('.empty-state')?.remove();
    }

    function renderItem(item) {
        hideEmptyState();

        let progress = 0;
        const cleaned_start = typeof item.start_date === 'string'
            ? item.start_date.replace(/(\.\d{3})\d*\.000Z$/, '$1Z') : item.start_date;
        const cleaned_due = typeof item.due_date === 'string'
            ? item.due_date.replace(/(\.\d{3})\d*\.000Z$/, '$1Z') : item.due_date;

        const start = new Date(cleaned_start);
        const due = new Date(cleaned_due);
        const now = new Date();
        
        if (isNaN(start.getTime()) || isNaN(due.getTime())) progress = 0;
        else if (now < start) progress = 0;
        else if (now > due) progress = 100;
        else {
            const totalMs = due - start;
            const passedMs = now - start;
            progress = Math.round((passedMs / totalMs) * 100);
        }

        const html = `
            <div class="task ${item.priority}" data-id="${item.id}">
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
                <span>Due: ${showDate(item.due_date)}</span>
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
        item.querySelector('.task-header button').addEventListener('click', async function (e) {
            e.stopPropagation();
            if (item.classList.contains('completed')) return;

            item.classList.add('completed');
            const progressBar = item.querySelector('.progress-bar-fill');
            const progressPercent = item.querySelector('.progress-percent');

            if (progressBar) progressBar.style.width = '100%';
            if (progressPercent) progressPercent.textContent = '100%';

            this.textContent = '✓ Done';

            setTimeout(async () => {
                try {
                    const taskId = item.dataset.id;
                    const response = await fetchWithAuth(
                        `${Config.URL_API}/project/${projectId}/items/${taskId}`, 
                        { method: 'DELETE' }
                    );
                    
                    if (response.ok) {
                        item.remove();
                        // Nếu không còn task nào thì hiện empty state
                        if (container.querySelectorAll('.task').length === 0) 
                            showEmptyState('noTask');
                    } else {
                        if (Config.TEST){
                            item.remove();
                            if (container.querySelectorAll('.task').length === 0) 
                                showEmptyState('noTask');
                        }
                        showWarning('Lỗi khi xóa task');
                    }
                } catch (err) {
                    if (Config.TEST) item.remove();
                    showWarning('Lỗi khi xóa task');
                }
            }, 400);
        });

        const panel = document.querySelector('.task-detail-panel');
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!panel) return;
            panel.classList.add('active');
        });
    }

    let cnt = 0;
    container.querySelector('h1 button').addEventListener('click', async (e) => {
        if (!projectId && !Config.TEST) {
            showWarning('Vui lòng chọn project trước!');
            return;
        }

        try {
            if (Config.TEST) {
                cnt++;
                let pri = ['high', 'medium', 'low'];
                const item = {
                    id: cnt, position: cnt, name: `Task ${cnt}`,
                    priority: pri[Math.ceil(Math.random() * 10) % 3],
                    start_date: new Date(new Date().setHours(0, 0, 0, 0)),
                    due_date: new Date(new Date().setHours(23, 59, 59, 999)),
                    time_spent: new Date('00:00:00'), note: ""
                };
                renderItem(item);
                return;
            }

            const response = await fetchWithAuth(`${Config.URL_API}/project/${projectId}/items`, {
                method: 'POST', body: JSON.stringify({})
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

    document.addEventListener('click', function(e) {
        const panel = document.querySelector('.task-detail-panel');
        const overlay_calendar = document.getElementById('taskCalendarOverlay');

        if (!panel || !panel.classList.contains('active')) return;

        // Nếu click vào overlay/calendar thì không đóng panel
        if (overlay_calendar && overlay_calendar.contains(e.target)) return;

        if (panel.contains(e.target)) return;

        panel.classList.remove('active');
    });

    // ========== TASK DETAIL DATE PICKER ==========
    class TaskDatePicker {
        constructor() {
            this.overlay = document.getElementById('taskCalendarOverlay');
            this.popup = document.getElementById('taskCalendarPopup');
            this.calendarDays = document.getElementById('taskCalendarDays');
            this.monthSelect = document.getElementById('taskMonthSelect');

            this.activeTarget = null; // 'start' or 'due'
            this.startDate = null;
            this.dueDate = null;
            this.currentMonth = new Date().getMonth();
            this.currentYear = new Date().getFullYear();

            this.init();
        }

        init() {
            // Populate year select
            // Trong init(), xóa phần populate year select, thêm vào:
            this.yearDisplay = document.getElementById('taskYearDisplay');
            this.yearDisplay.textContent = this.currentYear;

            document.getElementById('taskYearUp').addEventListener('click', () => {
                this.currentYear++;
                this.updateCalendar();
            });

            document.getElementById('taskYearDown').addEventListener('click', () => {
                this.currentYear--;
                this.updateCalendar();
            });
            this.monthSelect.value = this.currentMonth;

            // Open calendar on button click
            document.getElementById('startDateBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.activeTarget = 'start';
                this.openCalendar();
            });

            document.getElementById('dueDateBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.activeTarget = 'due';
                this.openCalendar();
            });

            // Close on overlay click
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.closeCalendar();
            });

            this.popup.addEventListener('click', (e) => e.stopPropagation());

            document.getElementById('taskPrevMonthBtn').addEventListener('click', () => {
                this.currentMonth--;
                if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
                this.updateCalendar();
            });

            document.getElementById('taskNextMonthBtn').addEventListener('click', () => {
                this.currentMonth++;
                if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
                this.updateCalendar();
            });

            this.monthSelect.addEventListener('change', (e) => {
                this.currentMonth = parseInt(e.target.value);
                this.updateCalendar();
            });

            document.getElementById('taskTodayBtn').addEventListener('click', () => {
                const today = new Date();
                this.selectDate(today.getDate(), today.getMonth(), today.getFullYear());
            });

            document.getElementById('taskClearBtn').addEventListener('click', () => {
                this.clearDate();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                    this.closeCalendar();
                }
            });

            this.updateCalendar();
        }

        openCalendar() {
            // Set current month/year to selected date if exists
            const current = this.activeTarget === 'start' ? this.startDate : this.dueDate;
            if (current) {
                this.currentMonth = current.getMonth();
                this.currentYear = current.getFullYear();
            }
            this.updateCalendar();
            this.overlay.classList.add('active');
        }

        closeCalendar() {
            this.overlay.classList.remove('active');
            this.activeTarget = null;
        }

        updateCalendar() {
            this.monthSelect.value = this.currentMonth;
            this.yearDisplay.textContent = this.currentYear;
            this.calendarDays.innerHTML = '';

            const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
            const lastDate = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
            const prevLastDate = new Date(this.currentYear, this.currentMonth, 0).getDate();
            const today = new Date();

            const selectedDate = this.activeTarget === 'start' ? this.startDate : this.dueDate;

            for (let i = firstDay; i > 0; i--) {
                this.calendarDays.appendChild(this.createDay(prevLastDate - i + 1, this.currentMonth - 1, this.currentYear, true, selectedDate, today));
            }
            for (let i = 1; i <= lastDate; i++) {
                this.calendarDays.appendChild(this.createDay(i, this.currentMonth, this.currentYear, false, selectedDate, today));
            }
            const total = this.calendarDays.children.length;
            for (let i = 1; i <= 42 - total; i++) {
                this.calendarDays.appendChild(this.createDay(i, this.currentMonth + 1, this.currentYear, true, selectedDate, today));
            }
        }

        createDay(day, month, year, isOther, selectedDate, today) {
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = day;
            if (isOther) div.classList.add('other-month');

            let actualMonth = month, actualYear = year;
            if (month < 0) { actualMonth = 11; actualYear = year - 1; }
            else if (month > 11) { actualMonth = 0; actualYear = year + 1; }

            if (day === today.getDate() && actualMonth === today.getMonth() && actualYear === today.getFullYear()) {
                div.classList.add('today');
            }
            if (selectedDate && day === selectedDate.getDate() && actualMonth === selectedDate.getMonth() && actualYear === selectedDate.getFullYear()) {
                div.classList.add('selected');
            }

            div.addEventListener('click', () => this.selectDate(day, actualMonth, actualYear));
            return div;
        }

        selectDate(day, month, year) {
            const date = new Date(year, month, day);
            const dd = String(day).padStart(2, '0');
            const mm = String(month + 1).padStart(2, '0');
            const formatted = `${dd}/${mm}/${year}`;

            if (this.activeTarget === 'start') {
                this.startDate = date;
                const btn = document.getElementById('startDateBtn');
                const text = document.getElementById('startDateText');
                text.textContent = formatted;
                text.classList.remove('placeholder');
                btn.classList.add('has-date');
            } else {
                this.dueDate = date;
                const btn = document.getElementById('dueDateBtn');
                const text = document.getElementById('dueDateText');
                text.textContent = formatted;
                text.classList.remove('placeholder');
                btn.classList.add('has-date');
            }

            this.closeCalendar();
        }

        clearDate() {
            if (this.activeTarget === 'start') {
                this.startDate = null;
                const text = document.getElementById('startDateText');
                text.textContent = 'Set date';
                text.classList.add('placeholder');
                document.getElementById('startDateBtn').classList.remove('has-date');
            } else {
                this.dueDate = null;
                const text = document.getElementById('dueDateText');
                text.textContent = 'Set date';
                text.classList.add('placeholder');
                document.getElementById('dueDateBtn').classList.remove('has-date');
            }
            this.closeCalendar();
        }
    }

    // Khởi tạo
    const taskDatePicker = new TaskDatePicker();

    let lastWarningTime = 0;
    function showWarning(warning_context) {
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

    function showDate(_date) {
        const cleaned = typeof _date === 'string' 
            ? _date.replace(/(\.\d{3})\d*\.000Z$/, '$1Z') 
            : _date;
        const date = new Date(cleaned);
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }

// ========== PRIORITY BADGE ==========
    const priorityBadge = document.querySelector('.priority-badge');
    const priorities = ['low', 'medium', 'high'];
    let currentPriorityIndex = 2;
    
    if (priorityBadge) {
        priorityBadge.addEventListener('click', function(e) {
            e.stopPropagation();
            currentPriorityIndex = (currentPriorityIndex + 1) % priorities.length;
            const newPriority = priorities[currentPriorityIndex];
            
            priorityBadge.classList.remove('low', 'medium', 'high');
            priorityBadge.classList.add(newPriority);
            
            const priorityText = newPriority.charAt(0).toUpperCase() + newPriority.slice(1);
            priorityBadge.querySelector('span').textContent = priorityText;
        });
    }
    
    // ========== TIMER ==========
    const btnTimer = document.querySelector('.btn-timer');
    const timeValue = document.querySelector('.time-value');
    let timerInterval = null;
    let totalSeconds = 0;
    let isTimerRunning = false;
    
    if (btnTimer) {
        btnTimer.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (isTimerRunning) {
                clearInterval(timerInterval);
                btnTimer.classList.remove('active');
                btnTimer.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                `;
                isTimerRunning = false;
            } else {
                timerInterval = setInterval(function() {
                    totalSeconds++;
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    timeValue.textContent = `${hours}h ${minutes}m`;
                }, 1000);
                
                btnTimer.classList.add('active');
                btnTimer.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                `;
                isTimerRunning = true;
            }
        });
    }
    
    // ========== DELETE TASK ==========
    const btnDeleteTask = document.querySelector('.btn-delete-task');
    if (btnDeleteTask) {
        btnDeleteTask.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Bạn có chắc chắn muốn xóa task này?')) {
                const taskDetailPanel = document.querySelector('.task-detail-panel');
                if (taskDetailPanel) {
                    taskDetailPanel.classList.remove('active');
                }
                console.log('Task deleted');
            }
        });
    }
});