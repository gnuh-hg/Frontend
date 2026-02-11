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

    // --- 2. QUẢN LÝ DỮ LIỆU (API CALLS DÙNG CONSTANTS) ---

    // Load dữ liệu ban đầu
    async function loadData() {
        try {
            // SỬA: Dùng Config.URL_API
            const response = await fetch(`${Config.URL_API}/data`);
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

    // Hàm lưu toàn bộ cấu trúc (Kéo thả)
    async function saveAllStructure() {
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
                    id: id, name: name, type: isFolder ? "FOLDER" : "PROJECT",
                    parent_id: parentId, position: index, color: color, expanded: isExpanded
                });

                if (isFolder) {
                    const subWrapper = li.querySelector('.list-wrapper');
                    if (subWrapper) traverse(subWrapper, id);
                }
            });
        }
        traverse(mainListWrapper);

        try {
            // SỬA: Dùng Config.URL_API
            await fetch(`${Config.URL_API}/save-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(items)
            });
        } catch (err) { console.error("Lỗi lưu cấu trúc:", err); }
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
                
                // SỬA: Dùng Config.URL_API
                await fetch(`${Config.URL_API}/items/${item.getAttribute('data-id')}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expanded: isExpanded })
                });
            });

            const subList = item.querySelector('.list-wrapper');
            if (subList) new Sortable(subList, sortableOptions);
        }
    }

    // --- 4. SORTABLE ---
    const sortableOptions = {
        group: 'nested', animation: 150, fallbackOnBody: true,
        swapThreshold: 0.65, ghostClass: 'sortable-ghost',
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

    // Thêm mới
    document.querySelector('.modal-box .btn-accept').addEventListener('click', async function() {
        const isFolder = folderForm.style.display !== 'none';
        const input = isFolder ? folderForm.querySelector('.modal-input') : projectForm.querySelector('.modal-input');
        const name = input.value.trim();
        const color = document.querySelector('.modal-box .color-swatch.selected')?.style.backgroundColor || '#ffffff';
        
        if (!name) return;

        const newItem = {
            id: (isFolder ? 'f' : 'p') + Date.now(),
            name: name, type: isFolder ? "FOLDER" : "PROJECT",
            color: color, parent_id: null, position: mainListWrapper.children.length, expanded: false
        };

        // SỬA: Dùng Config.URL_API
        const res = await fetch(`${Config.URL_API}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        });

        if (res.ok) {
            renderItem(newItem, mainListWrapper);
            input.value = '';
            closeModals();
        }
    });

    // Sửa
    document.querySelector('.modal-more-box .btn-accept').addEventListener('click', async function() {
        if (!currentSelectedItem) return;
        const id = currentSelectedItem.getAttribute('data-id');
        const newName = modalMoreBox.querySelector('.modal-input').value.trim();
        const newColor = modalMoreBox.querySelector('.color-swatch.selected')?.style.backgroundColor || '#ffffff';

        if (!newName) return;

        // SỬA: Dùng Config.URL_API
        const res = await fetch(`${Config.URL_API}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, color: newColor })
        });

        if (res.ok) {
            currentSelectedItem.querySelector('p').innerText = newName;
            const iconPath = currentSelectedItem.querySelector('.folder-icon path') || currentSelectedItem.querySelector('.project-icon circle');
            if (iconPath) iconPath.setAttribute('fill', newColor);
            closeModals();
        }
    });

    // Xóa
    document.querySelector('.btn-delete').addEventListener('click', async function() {
        if (!currentSelectedItem) return;
        const id = currentSelectedItem.getAttribute('data-id');

        // SỬA: Dùng Config.URL_API
        const res = await fetch(`${Config.URL_API}/items/${id}`, { method: 'DELETE' });
        if (res.ok) {
            currentSelectedItem.remove();
            closeModals();
        }
    });

    // Sự kiện UI cơ bản
    document.querySelector('.add-button').addEventListener('click', () => {
        overlay.style.display = 'flex';
        modalBox.style.display = 'flex';
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModals(); });
    document.querySelectorAll('.btn-cancel').forEach(btn => btn.addEventListener('click', closeModals));

    const btnTabFolder = document.querySelector('.btn-tab-folder');
    const btnTabProject = document.querySelector('.btn-tab-project');
    
    btnTabFolder?.addEventListener('click', () => {
        btnTabFolder.style.borderBottom = "1px solid #00FFFF";
        btnTabProject.style.borderBottom = "1px solid #2b2d31";
        folderForm.style.display = "block"; projectForm.style.display = "none";
    });
    btnTabProject?.addEventListener('click', () => {
        btnTabProject.style.borderBottom = "1px solid #00FFFF";
        btnTabFolder.style.borderBottom = "1px solid #2b2d31";
        projectForm.style.display = "block"; folderForm.style.display = "none";
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', function() {
            this.parentElement.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    loadData();
});