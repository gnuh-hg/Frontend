import * as Config from './../constants.js';

document.addEventListener('DOMContentLoaded', function() {
    // 1. Truy vấn các phần tử DOM
    const email_input = document.querySelector('.email-form input');
    const password_input = document.querySelector('.password-form input');
    
    const displayT1 = document.querySelector('.t1');
    const displayT2 = document.querySelector('.t2');


    // 3. Gán sự kiện click cho nút LOGIN
    document.querySelector('.login').addEventListener('click', async function () {
        const email = email_input.value.trim();
        const password = password_input.value.trim();

        // Kiểm tra và cập nhật nội dung
        if (displayT1) displayT1.innerHTML = email || "Chưa nhập email";
        if (displayT2) displayT2.innerHTML = password || "Chưa nhập mật khẩu";

        console.log("Đã cập nhật hiển thị:", { email, password });
        try {
            // OAuth2 yêu cầu dữ liệu dạng form-data
            const formData = new URLSearchParams();
            formData.append('username', email); // FastAPI mặc định lấy 'username'
            formData.append('password', password);

            const response = await fetch(`${Config.URL_API}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Đăng nhập thất bại');
            }

            // Lưu JWT vào localStorage hoặc SessionStorage
            localStorage.setItem('access_token', data.access_token);
            console.log('Đăng nhập thành công, đã lưu token.');
            return data;
        } catch (error) {
            console.error('Lỗi:', error.message);
        }
    });

    // (Tùy chọn) Cập nhật ngay khi người dùng đang gõ (Real-time)
    /*
    emailInput.addEventListener('input', updateDisplay);
    passwordInput.addEventListener('input', updateDisplay);
    */
});