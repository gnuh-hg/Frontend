import * as Config from './../constants.js';

document.addEventListener('DOMContentLoaded', function() {
    const name = document.querySelector('.name')
    const email = document.querySelector('.email-form');
    const password = document.querySelector('.password-form');
    
    document.querySelector('.login').addEventListener('click', async function () {
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
});