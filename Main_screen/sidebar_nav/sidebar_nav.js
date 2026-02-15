import * as Config from '../../constants.js';

document.addEventListener('DOMContentLoaded', function() {
    // --- 1. TRUY XUẤT DOM ELEMENTS ---
    const overlay = document.querySelector('.modal-overlay');
    const modalBox = document.querySelector('.modal-box');
    const modalMoreBox = document.querySelector('.modal-more-box');
    
    const folderForm = document.querySelector('.folder-form');
    const projectForm = document.querySelector('.project-form'); 
    const mainListWrapper = document.querySelector('.folder-container > .list-wrapper');
    
    let currentSelectedItem = null;
    let isSaving = false; // Flag để tránh race condition
    let isRedirecting = false;

    // ✅ HÀM CHUYỂN ĐỔI RGB SANG HEX
    function rgbToHex(rgb) {
        // Nếu đã là HEX, trả về luôn
        if (rgb.startsWith('#')) return rgb;
        
        // Parse RGB (ví dụ: "rgb(160, 174, 192)" -> ["160", "174", "192"])
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) return '#ffffff';
        
        const r = parseInt(result[0]);
        const g = parseInt(result[1]);
        const b = parseInt(result[2]);
        
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    function updateEmptyState() {
        const mainListWrapper = document.querySelector('.folder-container > .list-wrapper');
        const items = mainListWrapper.querySelectorAll(':scope > li');
        
        // Xóa empty state cũ nếu có
        const existingEmptyState = mainListWrapper.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }

        // Nếu không có items, hiển thị empty state
        if (items.length === 0) {
            const emptyStateHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="folderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        
                        <!-- Large folder -->
                        <g transform="translate(100, 95)">
                            <path d="M -35 -20 L -12 -20 L -6 -26 L 30 -26 C 36 -26 36 -20 36 -20 L 36 25 C 36 31 30 31 30 31 L -30 31 C -36 31 -36 25 -36 25 Z" 
                                  fill="none" 
                                  stroke="url(#folderGradient)" 
                                  stroke-width="3.5" 
                                  stroke-linecap="round" 
                                  stroke-linejoin="round"/>
                            
                            <!-- Inner detail -->
                            <line x1="-20" y1="0" x2="20" y2="0" 
                                  stroke="#6366f1" 
                                  stroke-width="2" 
                                  stroke-linecap="round"
                                  opacity="0.3"/>
                            <line x1="-20" y1="8" x2="20" y2="8" 
                                  stroke="#6366f1" 
                                  stroke-width="2" 
                                  stroke-linecap="round"
                                  opacity="0.3"/>
                            <line x1="-20" y1="16" x2="10" y2="16" 
                                  stroke="#6366f1" 
                                  stroke-width="2" 
                                  stroke-linecap="round"
                                  opacity="0.2"/>
                        </g>
                        
                        <!-- Plus badge -->
                        <circle cx="128" cy="115" r="16" 
                                fill="#6366f1"/>
                        <line x1="128" y1="106" x2="128" y2="124" 
                              stroke="white" 
                              stroke-width="3" 
                              stroke-linecap="round"/>
                        <line x1="119" y1="115" x2="137" y2="115" 
                              stroke="white" 
                              stroke-width="3" 
                              stroke-linecap="round"/>
                    </svg>
                        
                    <h3>No folders or projects yet</h3>
                    <p>Click "Add folder" below to get started</p>
                </div>
            `;
            mainListWrapper.insertAdjacentHTML('beforeend', emptyStateHTML);
        }
    }

    // --- FETCHAUTH ĐÃ SỬA ---
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
                alert("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
                window.location.href = "./Account/login.html";
            }
            throw new Error("Unauthorized"); // Ngăn code tiếp tục chạy
        }
        
        return response;
    }
    // --- 2. QUẢN LÝ DỮ LIỆU (API CALLS) ---

    // Load dữ liệu ban đầu
    async function loadData() {
        try {
            const response = await fetchWithAuth(`${Config.URL_API}/items`);
            
            // SỬA: Kiểm tra response.ok
            if (!response.ok) {
                console.error("Không thể tải dữ liệu");
                return;
            }
            
            const items = await response.json();
            items.sort((a, b) => a.position - b.position);
            mainListWrapper.innerHTML = '';

            function renderRecursive(parentId, container) {
                const children = items.filter(item => item.parent_id === parentId);
                children.forEach(item => {
                    renderItem(item, container);
                    if (item.type === "FOLDER") {
                        const newContainer = document.querySelector(`[data-id="${item.id}"] .list-wrapper`);
                        if (newContainer) renderRecursive(item.id, newContainer);
                    }
                });
            }
            renderRecursive(null, mainListWrapper);
        } catch (err) {
            console.error("Lỗi khi load dữ liệu:", err);
        }
        updateEmptyState();
    }

    // SỬA: Debounce để tránh gọi API liên tục
    let saveTimeout = null;
    async function saveAllStructure() {
        // Nếu đang save hoặc đã có timeout, skip
        if (isSaving) return;
        
        // Clear timeout cũ nếu có
        if (saveTimeout) clearTimeout(saveTimeout);
        
        // Đợi 500ms sau lần kéo thả cuối mới save
        saveTimeout = setTimeout(async () => {
            isSaving = true;
            
            const items = [];
            function traverse(wrapper, parentId = null) {
                const listItems = wrapper.querySelectorAll(':scope > li');
                listItems.forEach((li, index) => {
                    const id = li.getAttribute('data-id');
                    const name = li.querySelector('p').innerText;
                    const isFolder = li.classList.contains('folder-item');
                    const iconPath = li.querySelector('.folder-icon path') || li.querySelector('.project-icon circle');
                    const colorRaw = iconPath ? (iconPath.getAttribute('fill') || iconPath.style.fill) : '#ffffff';
                    const color = rgbToHex(colorRaw); // ✅ Chuyển đổi RGB sang HEX
                    const isExpanded = li.classList.contains('is-expanded');

                    items.push({
                        id: id ? String(id) : '',
                        name: name ? String(name) : '',  // Hoặc dùng giá trị mặc định
                        type: isFolder ? "FOLDER" : "PROJECT",
                        parent_id: parentId ? String(parentId) : null,
                        position: parseInt(index) || 0,
                        color: color,
                        expanded: Boolean(isExpanded)
                    });

                    if (isFolder) {
                        const subWrapper = li.querySelector('.list-wrapper');
                        if (subWrapper) traverse(subWrapper, id);
                    }
                });
            }
            traverse(mainListWrapper);

            try {
                const response = await fetchWithAuth(`${Config.URL_API}/items/save-all`, { 
                    method: 'POST',
                    body: JSON.stringify(items)
                });
                
                // SỬA: Kiểm tra response
                if (!response.ok) {
                    console.error("Lỗi khi lưu cấu trúc");
                }
            } catch (err) { 
                console.error("Lỗi lưu cấu trúc:", err); 
            } finally {
                isSaving = false;
            }
        }, 500);
    }

    // --- 3. LOGIC GIAO DIỆN & RENDER ---

    function renderItem(item, wrapper) {
        const color = item.color || "#ffffff"; 
        const expandedClass = item.expanded ? 'is-expanded' : '';
        const iconExpandedStyle = item.expanded ? 'block' : 'none';
        const iconCollapsedStyle = item.expanded ? 'none' : 'block';

        let html = '';
        if (item.type === "FOLDER") {
            html = `
                <li class="folder-item ${expandedClass}" data-id="${item.id}">
                    <div class="item-header">
                        <svg class="icon-collapsed" viewBox="0 0 24 24" style="display:${iconCollapsedStyle};"><polyline points="8,5 16,12 8,19"/></svg>
                        <svg class="icon-expanded" viewBox="0 0 24 24" style="display:${iconExpandedStyle};"><polyline points="5,8 12,16 19,8"/></svg>
                        <svg class="folder-icon" viewBox="0 0 64 64"><path d="M8 20 H22 L26 16 H44 Q50 16 50 22 V40 Q50 48 42 48 H16 Q8 48 8 40 Z" fill="${color}"/></svg>
                        <p class="label">${item.name}</p>
                        <div class="modal-more"><svg class="action-more" viewBox="0 0 20 5" width="60"><circle cx="5" cy="3" r="1"/><circle cx="10" cy="3" r="1"/><circle cx="15" cy="3" r="1"/></svg></div>
                    </div>
                    <div class="item-content"><ul class="list-wrapper"></ul></div>
                </li>`;
        } else {
            html = `
                <li class="project-item-child" data-id="${item.id}">
                    <svg class="project-icon" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${color}"/></svg>
                    <p>${item.name}</p>
                    <div class="modal-more"><svg class="action-more" viewBox="0 0 20 5" width="60"><circle cx="5" cy="3" r="1"/><circle cx="10" cy="3" r="1"/><circle cx="15" cy="3" r="1"/></svg></div>
                </li>`;
        }

        wrapper.insertAdjacentHTML('beforeend', html);
        attachEvents(wrapper.lastElementChild);
    }

    function attachEvents(item) {
        // Nút Option
        item.querySelector('.modal-more').addEventListener('click', (e) => {
            e.stopPropagation(); 
            currentSelectedItem = item; 
            const currentName = item.querySelector('p').innerText;
            const iconPath = item.querySelector('.folder-icon path') || item.querySelector('.project-icon circle');
            const currentColorRaw = iconPath ? (iconPath.getAttribute('fill') || iconPath.style.fill) : '#ffffff';
            const currentColor = rgbToHex(currentColorRaw); // ✅ Chuyển đổi sang HEX
            
            overlay.style.display = 'flex';
            modalMoreBox.style.display = 'flex';
            modalBox.style.display = 'none';
            modalMoreBox.querySelector('.modal-input').value = currentName;
            
            modalMoreBox.querySelectorAll('.color-swatch').forEach(s => {
                s.classList.remove('selected');
                const swatchColor = rgbToHex(s.style.backgroundColor); // ✅ Chuyển đổi sang HEX
                if (swatchColor === currentColor) s.classList.add('selected');
            });
        });

        // Đóng/Mở Folder
        if (item.classList.contains('folder-item')) {
            item.querySelector('.item-header').addEventListener('click', async function() {
                const isExpanded = item.classList.toggle('is-expanded');
                item.querySelector('.icon-expanded').style.display = isExpanded ? 'block' : 'none';
                item.querySelector('.icon-collapsed').style.display = isExpanded ? 'none' : 'block';
                
                // SỬA: Kiểm tra response
                try {
                    const response = await fetchWithAuth(`${Config.URL_API}/items/${item.getAttribute('data-id')}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ expanded: isExpanded })
                    });
                    
                    if (!response.ok) {
                        console.error("Không thể cập nhật trạng thái folder");
                    }
                } catch (err) {
                    console.error("Lỗi khi toggle folder:", err);
                }
            });

            const subList = item.querySelector('.list-wrapper');
            if (subList) new Sortable(subList, sortableOptions);
        }
    }

    // --- 4. SORTABLE ---
    const sortableOptions = {
        group: 'nested', 
        animation: 150, 
        fallbackOnBody: true,
        swapThreshold: 0.65, 
        ghostClass: 'sortable-ghost',
        onEnd: saveAllStructure,
        
        // ✅ THÊM: Kiểm tra trước khi move
        onMove: function(evt) {
            const draggedItem = evt.dragged;
            const targetList = evt.to;

            // Tìm folder cha gần nhất của target list
            const targetFolder = targetList.closest('.folder-item');

            // Tính độ sâu hiện tại của target
            const targetDepth = targetFolder ? getFolderDepth(targetFolder) : 0;

            // Nếu item được kéo là folder, tính độ sâu con của nó
            let maxChildDepth = 0;
            if (draggedItem.classList.contains('folder-item')) {
                maxChildDepth = getMaxChildDepth(draggedItem);
            }

            // Kiểm tra: độ sâu target + 1 (chính nó) + độ sâu con <= 5
            const totalDepth = targetDepth + 1 + maxChildDepth;

            if (totalDepth > 5) {
                // Hiển thị thông báo
                showDepthWarning();
                return false; // Chặn việc di chuyển
            }

            return true; // Cho phép di chuyển
        }
    };
    
    function getFolderDepth(element) {
        let depth = 0;
        let current = element;
        
        while (current) {
            if (current.classList && current.classList.contains('folder-item')) {
                depth++;
            }
            current = current.parentElement?.closest('.folder-item');
        }

        return depth;
    }

    // Hàm tính độ sâu tối đa của các folder con
    function getMaxChildDepth(folderElement) {
        let maxDepth = 0;

        function traverse(element, currentDepth) {
            const childFolders = element.querySelectorAll(':scope > .item-content > .list-wrapper > .folder-item');

            if (childFolders.length === 0) {
                maxDepth = Math.max(maxDepth, currentDepth);
                return;
            }

            childFolders.forEach(child => {
                traverse(child, currentDepth + 1);
            });
        }

        traverse(folderElement, 0);
        return maxDepth;
    }

    let lastWarningTime = 0;
    // Hàm hiển thị cảnh báo
    function showDepthWarning() {
        const currentTime = Date.now();
        if (currentTime - lastWarningTime < 3000) return;
        lastWarningTime = currentTime;

        // Tạo tooltip cảnh báo
        const existingWarning = document.querySelector('.depth-warning');
        if (existingWarning) existingWarning.remove();

        const warning = document.createElement('div');
        warning.className = 'depth-warning';
        warning.textContent = 'Maximum nesting depth is 5 levels';
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

    if (mainListWrapper) new Sortable(mainListWrapper, sortableOptions);

    // --- 5. MODAL LOGIC ---

    function closeModals() {
        overlay.style.display = 'none';
        modalBox.style.display = 'none';
        modalMoreBox.style.display = 'none';
        currentSelectedItem = null; 
    }

    // SỬA: Thêm mới - LẤY ID TỪ BACKEND
    document.querySelector('.modal-box .btn-accept').addEventListener('click', async function() {
        const isFolder = folderForm.style.display !== 'none';
        const input = isFolder ? folderForm.querySelector('.modal-input') : projectForm.querySelector('.modal-input');
        const name = input.value.trim();
        const colorRaw = document.querySelector('.modal-box .color-swatch.selected')?.style.backgroundColor || '#ffffff';
        const color = rgbToHex(colorRaw); // ✅ Chuyển đổi sang HEX
        
        if (!name) {
            input.focus();
            alert("Vui lòng nhập tên!");
            return;
        }

        const newItem = {
            name: name, 
            type: isFolder ? "FOLDER" : "PROJECT",
            color: color, 
            parent_id: null, 
            position: mainListWrapper.children.length, 
            expanded: false
        };

        try {
            const res = await fetchWithAuth(`${Config.URL_API}/items`, {
                method: 'POST',
                body: JSON.stringify(newItem)
            });

            if (res.ok) {
                const createdItem = await res.json();
                renderItem(createdItem, mainListWrapper);
                updateEmptyState();
                input.value = '';
                closeModals();
            } else {
                const errorData = await res.json();
                alert(`Không thể tạo mục mới: ${errorData.detail || 'Lỗi không xác định'}`);
            }
        } catch (err) {
            console.error("Lỗi khi tạo item:", err);
        }
    });

    // SỬA: Sửa - Kiểm tra response
    document.querySelector('.modal-more-box .btn-accept').addEventListener('click', async function() {
        if (!currentSelectedItem) return;
        
        const id = currentSelectedItem.getAttribute('data-id');
        const newName = modalMoreBox.querySelector('.modal-input').value.trim();
        const newColorRaw = modalMoreBox.querySelector('.color-swatch.selected')?.style.backgroundColor || '#ffffff';
        const newColor = rgbToHex(newColorRaw); // ✅ Chuyển đổi sang HEX

        if (!newName) {
            modalMoreBox.querySelector('.modal-input').focus();
            alert("Vui lòng nhập tên!");
            return;
        }

        try {
            const res = await fetchWithAuth(`${Config.URL_API}/items/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name: newName, color: newColor })
            });

            if (res.ok) {
                currentSelectedItem.querySelector('p').innerText = newName;
                const iconPath = currentSelectedItem.querySelector('.folder-icon path') || currentSelectedItem.querySelector('.project-icon circle');
                if (iconPath) iconPath.setAttribute('fill', newColor);
                closeModals();
            } else {
                alert("Không thể cập nhật");
            }
        } catch (err) {
            console.error("Lỗi khi sửa item:", err);
        }
    });

    // SỬA: Xóa - Kiểm tra response
    document.querySelector('.btn-delete').addEventListener('click', async function() {
        if (!currentSelectedItem) return;
        
        const id = currentSelectedItem.getAttribute('data-id');

        try {
            const res = await fetchWithAuth(`${Config.URL_API}/items/${id}`, { 
                method: 'DELETE' 
            });
            
            if (res.ok) {
                currentSelectedItem.remove();
                updateEmptyState();
                closeModals();
            } else {
                alert("Không thể xóa");
            }
        } catch (err) {
            console.error("Lỗi khi xóa item:", err);
        }
    });

    // Sự kiện UI cơ bản
    document.querySelector('.add-button').addEventListener('click', () => {
        overlay.style.display = 'flex';
        modalBox.style.display = 'flex';
    });

    overlay.addEventListener('click', (e) => { 
        if (e.target === overlay) closeModals(); 
    });
    
    document.querySelectorAll('.btn-cancel').forEach(btn => 
        btn.addEventListener('click', closeModals)
    );

    const btnTabFolder = document.querySelector('.btn-tab-folder');
    const btnTabProject = document.querySelector('.btn-tab-project');
    
    btnTabFolder?.addEventListener('click', () => {
        btnTabFolder.style.backgroundColor = "#6366f1";
        btnTabProject.style.backgroundColor = "transparent"
        folderForm.style.display = "block"; 
        projectForm.style.display = "none";
    });
    
    btnTabProject?.addEventListener('click', () => {
        btnTabProject.style.backgroundColor = "#6366f1";
        btnTabFolder.style.backgroundColor = "transparent"
        projectForm.style.display = "block"; 
        folderForm.style.display = "none";
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', function() {
            this.parentElement.querySelectorAll('.color-swatch').forEach(s => 
                s.classList.remove('selected')
            );
            this.classList.add('selected');
        });
    });

    loadData();
});