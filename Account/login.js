import * as Config from './../constants.js';

document.addEventListener('DOMContentLoaded', function() {
    // 1. Truy vấn các phần tử DOM
    const email_input = document.querySelector('.user-email input');
    const password_input = document.querySelector('.user-password input');

    // 3. Gán sự kiện click cho nút LOGIN
    document.querySelector('.login').addEventListener('click', async function () {
        const email = email_input.value.trim();
        const password = password_input.value.trim();

        try {
            const response = await fetch(`${Config.URL_API}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: JSON.stringify({ 
                    email: email, 
                    password: password 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access_token);
                window.location.href = "../Main_screen/home.html";
            } else warning.innerHTML = data.detail;

        } catch (error) {
            console.error('Lỗi:', error.message);
        }
    });
});