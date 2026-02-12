import * as Config from './../constants.js';

document.addEventListener('DOMContentLoaded', function() {
    // 1. Truy vấn các phần tử DOM
    const name_input = document.querySelector('.user-name input');
    const email_input = document.querySelector('.user-email input');
    const password_input = document.querySelector('.user-password input');
    const warning = document.querySelector('.warning');
    const signup_btn = document.querySelector('.signup');

    // 2. Gán sự kiện click cho nút SIGNUP
    signup_btn.addEventListener('click', async function (e) {
        e.preventDefault(); // Ngăn chặn load lại trang nếu nút nằm trong form

        const username = name_input.value.trim();
        const email = email_input.value.trim();
        const password = password_input.value.trim();

        // Kiểm tra sơ bộ phía Client
        if (!username || !email || !password) {
            warning.innerHTML = "Vui lòng nhập đầy đủ thông tin!";
            return;
        }

        // --- ĐIỂM QUAN TRỌNG: Gửi JSON thay vì Form Data ---
        const signUpData = {
            username: username,
            email: email,
            password: password
        };

        try {
            const response = await fetch(`${Config.URL_API}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Backend nhận Pydantic UserCreate cần cái này
                },
                body: JSON.stringify(signUpData), // Chuyển sang chuỗi JSON
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access_token);
                window.location.href = "../Main_screen/home.html"; 
            } else {
                // Xử lý lỗi trả về từ FastAPI
                // Nếu là lỗi validation (422), detail sẽ là một mảng
                if (Array.isArray(data.detail)) {
                    warning.innerHTML = data.detail[0].msg;
                } else {
                    // Nếu là lỗi logic (400) như "Email đã tồn tại"
                    warning.innerHTML = data.detail;
                }
            }

        } catch (error) {
            console.error('Lỗi kết nối:', error);
            warning.innerHTML = "Không thể kết nối đến máy chủ!";
        }
    });
});