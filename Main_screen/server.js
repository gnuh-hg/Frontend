const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const DATA_FILE = 'test.json';

// Hàm helper đọc file
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

// Hàm helper ghi file
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// 1. Lấy toàn bộ dữ liệu
app.get('/data', (req, res) => {
    res.json(readData());
});

// 2. Thêm mới một item
app.post('/items', (req, res) => {
    const items = readData();
    const newItem = req.body;
    items.push(newItem);
    writeData(items);
    res.status(201).json(newItem);
});

// 3. Cập nhật một item (Sửa tên, màu, hoặc vị trí khi kéo thả)
app.put('/items/:id', (req, res) => {
    const { id } = req.params;
    let items = readData();
    const index = items.findIndex(item => item.id === id);
    
    if (index !== -1) {
        items[index] = { ...items[index], ...req.body };
        writeData(items);
        res.json(items[index]);
    } else {
        res.status(404).send('Không tìm thấy item');
    }
});

// 4. Xóa item (Xóa luôn cả con của nó nếu là Folder)
app.delete('/items/:id', (req, res) => {
    const { id } = req.params;
    let items = readData();

    const getIdsToDelete = (parentId, allItems) => {
        let ids = [parentId];
        allItems.filter(item => item.parent_id === parentId).forEach(child => {
            ids = [...ids, ...getIdsToDelete(child.id, allItems)];
        });
        return ids;
    };

    const idsToDelete = getIdsToDelete(id, items);
    const filteredItems = items.filter(item => !idsToDelete.includes(item.id));
    
    writeData(filteredItems);
    res.send({ message: 'Đã xóa thành công', deletedCount: idsToDelete.length });
});

// 5. Cập nhật vị trí hàng loạt (Dùng sau khi kéo thả xong)
app.post('/save-all', (req, res) => {
    writeData(req.body);
    res.send('Đã lưu cấu trúc mới');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));