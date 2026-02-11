document.addEventListener('DOMContentLoaded', function() {
    // 1. Truy vấn các phần tử DOM
    const emailInput = document.querySelector('.email-form input');
    const passwordInput = document.querySelector('.password-form input');
    const loginBtn = document.querySelector('.login');
    
    const displayT1 = document.querySelector('.t1');
    const displayT2 = document.querySelector('.t2');

    // 2. Định nghĩa hàm xử lý hiển thị
    function updateDisplay() {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Kiểm tra và cập nhật nội dung
        if (displayT1) {
            displayT1.innerHTML = email || "Chưa nhập email";
        }
        if (displayT2) {
            displayT2.innerHTML = password || "Chưa nhập mật khẩu";
        }

        console.log("Đã cập nhật hiển thị:", { email, password });
    }

    // 3. Gán sự kiện click cho nút LOGIN
    loginBtn.addEventListener('click', function() {
        updateDisplay();
    });

    // (Tùy chọn) Cập nhật ngay khi người dùng đang gõ (Real-time)
    /*
    emailInput.addEventListener('input', updateDisplay);
    passwordInput.addEventListener('input', updateDisplay);
    */
});