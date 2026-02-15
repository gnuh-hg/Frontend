import * as Config from '../constants.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('access_token');
    if (!token) window.location.href = './Account/login.html';
});