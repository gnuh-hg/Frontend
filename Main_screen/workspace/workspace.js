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