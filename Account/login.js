import * as Config from './../constants.js';

document.addEventListener('DOMContentLoaded', function() {
    const email_input = document.querySelector('.user-email input');
    const password_input = document.querySelector('.user-password input');
    const warning = document.querySelector('.warning');
    const login_btn = document.querySelector('.login');

    login_btn.addEventListener('click', async function (e) {
        e.preventDefault();

        const email = email_input.value.trim();
        const password = password_input.value.trim();

        if (!email || !password) {
            warning.innerHTML = "Vui lòng nhập đầy đủ thông tin";
            return;
        }

        // Gửi JSON với key là 'email' đúng như bạn muốn
        const loginData = {
            email: email,
            password: password
        };

        try {
            const response = await fetch(`${Config.URL_API}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Chuyển sang JSON
                },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access_token);
                window.location.href = "../Main_screen/home.html";
            } else {
                warning.innerHTML = data.detail;
            }

        } catch (error) {
            console.error('Lỗi:', error);
            warning.innerHTML = "Lỗi kết nối!";
        }
    });
});