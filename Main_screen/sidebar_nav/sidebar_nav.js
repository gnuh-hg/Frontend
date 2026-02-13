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
                window.location.href = "../Account/login.html";
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
                    const color = iconPath ? (iconPath.getAttribute('fill') || iconPath.style.fill) : '#ffffff';
                    const isExpanded = li.classList.contains('is-expanded');

                    items.push({
                        id: id ? String(id) : '',
                        name: name ? String(name) : '',  // Hoặc dùng giá trị mặc định
                        type: isFolder ? "FOLDER" : "PROJECT",
                        parent_id: parentId ? String(parentId) : null,
                        position: parseInt(index) || 0,
                        color: color || "#ffffff",
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
            const currentColor = iconPath ? (iconPath.getAttribute('fill') || iconPath.style.fill) : '#ffffff';
            
            overlay.style.display = 'flex';
            modalMoreBox.style.display = 'flex';
            modalBox.style.display = 'none';
            modalMoreBox.querySelector('.modal-input').value = currentName;
            
            modalMoreBox.querySelectorAll('.color-swatch').forEach(s => {
                s.classList.remove('selected');
                if (s.style.backgroundColor === currentColor) s.classList.add('selected');
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
                        method: 'PUT',
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
        onEnd: saveAllStructure 
    };

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
        const color = document.querySelector('.modal-box .color-swatch.selected')?.style.backgroundColor || '#ffffff';
        
        if (!name) {
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            });

            if (res.ok) {
                const createdItem = await res.json();
                renderItem(createdItem, mainListWrapper);
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
        const newColor = modalMoreBox.querySelector('.color-swatch.selected')?.style.backgroundColor || '#ffffff';

        if (!newName) {
            alert("Vui lòng nhập tên!");
            return;
        }

        try {
            const res = await fetchWithAuth(`${Config.URL_API}/items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
        const isFolder = currentSelectedItem.classList.contains('folder-item');

        try {
            const res = await fetchWithAuth(`${Config.URL_API}/items/${id}`, { 
                method: 'DELETE' 
            });
            
            if (res.ok) {
                currentSelectedItem.remove();
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
        btnTabFolder.style.borderBottom = "1px solid #00FFFF";
        btnTabProject.style.borderBottom = "1px solid #2b2d31";
        folderForm.style.display = "block"; 
        projectForm.style.display = "none";
    });
    
    btnTabProject?.addEventListener('click', () => {
        btnTabProject.style.borderBottom = "1px solid #00FFFF";
        btnTabFolder.style.borderBottom = "1px solid #2b2d31";
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