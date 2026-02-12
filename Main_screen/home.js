import * as Config from '../constants.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('access_token');
    if (!token) window.location.href = '../Account/login.html';

    document.addEventListener('click', function() {
        localStorage.removeItem('access_token'); // Xóa token
        console.log('Token đã bị xóa!');
        
        window.location.href = '../Account/login.html';
    });
});