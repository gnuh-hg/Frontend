import * as Config from '../../configuration.js';

document.addEventListener('DOMContentLoaded', function() {
    const username = document.querySelector('.username');
    username.addEventListener('click', function() {
        localStorage.removeItem('access_token'); // Xóa token
        
        window.location.href = './Account/login.html';
    });
});