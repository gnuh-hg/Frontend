document.addEventListener('DOMContentLoaded', function() {
    async function displayProjectDashboard(projectId) {
        const dashboardTitle = document.querySelector('.right-panel h1'); // Giả định tiêu đề bên phải
        const taskContainer = document.querySelector('.task-list-container'); // Vùng chứa task chi tiết

        try {
            // Gọi dữ liệu từ file JSON mới dành riêng cho chi tiết project
            // Ví dụ: http://localhost:3000/project_details?id=p123
            const response = await fetch(`http://localhost:3000/project_details/${projectId}`);
            const details = await response.json();

            // Cập nhật giao diện bên phải
            if (dashboardTitle) dashboardTitle.innerText = details.name;

            // Render các thông tin mở rộng (Số task, thời gian, biểu đồ...)
            console.log("Đã tải dữ liệu cho Project ID:", projectId);

            // Tại đây bạn có thể viết thêm logic render các ô "0 Tasks to Do", "0m Elapsed Time" như trong ảnh
        } catch (err) {
            console.error("Không tìm thấy dữ liệu chi tiết cho Project này:", err);
            // Nếu chưa có file JSON chi tiết, ít nhất hãy cập nhật tiêu đề từ item hiện tại
        }
    }
});