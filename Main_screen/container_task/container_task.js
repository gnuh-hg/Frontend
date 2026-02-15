function toggleDone(button) {
  const task = button.closest('.task');
  
  if (task.classList.contains('completed')) {
    return;
  }
  
  task.classList.add('completed');
  
  const progressBar = task.querySelector('.progress-bar-fill');
  const progressPercent = task.querySelector('.progress-percent');
  
  progressBar.style.width = '100%';
  progressPercent.textContent = '100%';
  
  button.textContent = '✓ Done';
}

/* =================================================================
   TASK DETAIL PANEL JAVASCRIPT - SIMPLIFIED
   Chỉ show/hide panel, nội dung cố định
   ================================================================= */

/**
 * Mở task detail panel
 */
function openTaskDetail() {
    const panel = document.querySelector('.task-detail-panel');
    if (!panel) {
        console.error('Task detail panel not found');
        return;
    }
    
    // Simply show panel
    panel.classList.add('active');
}

/**
 * Đóng task detail panel
 */
function closeTaskDetail() {
    const panel = document.querySelector('.task-detail-panel');
    if (!panel) return;
    
    // Simply hide panel
    panel.classList.remove('active');
}

// ========== EVENT LISTENERS ==========

document.addEventListener('DOMContentLoaded', function() {
    
    // Click on task card to open detail
    document.addEventListener('click', function(e) {
        const taskCard = e.target.closest('.task');
        const doneButton = e.target.closest('.btn-done');
        
        if (taskCard && !doneButton) {
            e.stopPropagation();
            openTaskDetail();
        }
    });
    
    // Close button
    const closeBtn = document.querySelector('.btn-close-detail');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeTaskDetail();
        });
    }
    
    // ESC key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const panel = document.querySelector('.task-detail-panel.active');
            if (panel) {
                closeTaskDetail();
            }
        }
    });
});