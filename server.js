// const express = require('express');
// const http = require('http');
// const cors = require('cors');
// const { Server } = require('socket.io');
// const bcrypt = require('bcryptjs');
// const db = require('./db');
// require('dotenv').config();
//
// const app = express();
// const server = http.createServer(app);
//
// const io = new Server(server, {
//     cors: { origin: '*' }
// });
//
// app.use(cors());
// app.use(express.json());
//
// let serviceRequests = [];
//
// // ======================= 1. XÁC THỰC & PHÂN QUYỀN =======================
//
// // Đăng nhập nội bộ
// app.post('/api/auth/login', async (req, res) => {
//     const { username, password } = req.body;
//     if (!username || !password) {
//         return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu!' });
//     }
//
//     try {
//         const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
//         if (rows.length === 0) {
//             return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác!' });
//         }
//
//         const user = rows[0];
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác!' });
//         }
//
//         res.json({
//             message: 'Đăng nhập thành công!',
//             user: {
//                 id: user.user_id,
//                 username: user.username,
//                 full_name: user.full_name,
//                 role: user.role
//             }
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Khách hàng đăng ký hội viên
// app.post('/api/customer/register', async (req, res) => {
//     const { phone, full_name, password } = req.body;
//     if (!phone || !full_name || !password) {
//         return res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên, SĐT và mật khẩu!' });
//     }
//
//     try {
//         const [exist] = await db.query('SELECT customer_id FROM customers WHERE phone = ?', [phone]);
//         if (exist.length > 0) {
//             return res.status(400).json({ error: 'Số điện thoại này đã được đăng ký!' });
//         }
//
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);
//
//         const [result] = await db.query(
//             'INSERT INTO customers (phone, full_name, password, points) VALUES (?, ?, ?, 0)',
//             [phone, full_name, hashedPassword]
//         );
//
//         res.status(201).json({
//             message: 'Đăng ký thành công!',
//             customer: { id: result.insertId, phone, full_name, points: 0 }
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Khách hàng đăng nhập tích điểm
// app.post('/api/customer/login', async (req, res) => {
//     const { phone, password } = req.body;
//     try {
//         const [rows] = await db.query('SELECT * FROM customers WHERE phone = ?', [phone]);
//         if (rows.length === 0) {
//             return res.status(401).json({ error: 'Số điện thoại chưa đăng ký hội viên!' });
//         }
//
//         const customer = rows[0];
//         const isMatch = await bcrypt.compare(password, customer.password);
//         if (!isMatch) {
//             return res.status(401).json({ error: 'Mật khẩu không chính xác!' });
//         }
//
//         res.json({
//             message: 'Đăng nhập tích điểm thành công!',
//             customer: {
//                 id: customer.customer_id,
//                 phone: customer.phone,
//                 full_name: customer.full_name,
//                 points: customer.points
//             }
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // ======================= 2. THỰC ĐƠN & GỌI MÓN =======================
//
// // Lấy menu (Khách: chỉ món available; Admin: lấy tất cả nếu query all=true)
// app.get('/api/menu', async (req, res) => {
//     const { all } = req.query;
//     try {
//         const query = all === 'true'
//             ? `SELECT m.*, c.category_name FROM menu_items m LEFT JOIN categories c ON m.category_id = c.category_id ORDER BY m.item_id DESC`
//             : `SELECT m.*, c.category_name FROM menu_items m LEFT JOIN categories c ON m.category_id = c.category_id WHERE m.is_available = TRUE ORDER BY m.item_id ASC`;
//         const [rows] = await db.query(query);
//         res.json(rows);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Thêm món mới
// app.post('/api/admin/menu', async (req, res) => {
//     const { name, category_id, price, vat_rate, portion_type, portion_desc, large_price, image_url, badge } = req.body;
//     try {
//         await db.query(`
//             INSERT INTO menu_items (name, category_id, price, vat_rate, portion_type, portion_desc, large_price, image_url, badge, is_available)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
//         `, [name, category_id || 1, price, vat_rate || 8, portion_type || 'fixed', portion_desc || '', large_price || null, image_url, badge || 'none']);
//         res.status(201).json({ message: 'Thêm món mới thành công!' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Chỉnh sửa món ăn
// app.put('/api/admin/menu/:id', async (req, res) => {
//     const { id } = req.params;
//     const { name, category_id, price, vat_rate, portion_type, portion_desc, large_price, image_url, badge } = req.body;
//     try {
//         await db.query(`
//             UPDATE menu_items
//             SET name = ?, category_id = ?, price = ?, vat_rate = ?, portion_type = ?, portion_desc = ?, large_price = ?, image_url = ?, badge = ?
//             WHERE item_id = ?
//         `, [name, category_id || 1, price, vat_rate || 8, portion_type, portion_desc, large_price || null, image_url, badge, id]);
//         res.json({ message: 'Cập nhật món thành công!' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Bật / Tắt trạng thái Còn hàng / Hết hàng
// app.patch('/api/admin/menu/:id/toggle-status', async (req, res) => {
//     const { id } = req.params;
//     try {
//         await db.query(`UPDATE menu_items SET is_available = NOT is_available WHERE item_id = ?`, [id]);
//         res.json({ message: 'Đã cập nhật trạng thái món!' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Xóa món
// app.delete('/api/admin/menu/:id', async (req, res) => {
//     const { id } = req.params;
//     try {
//         await db.query(`DELETE FROM menu_items WHERE item_id = ?`, [id]);
//         res.json({ message: 'Đã xóa món thành công!' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Khách đặt món
// app.post('/api/orders', async (req, res) => {
//     const { table_id, items, customer_id } = req.body;
//     if (!table_id || !items || items.length === 0) {
//         return res.status(400).json({ error: 'Thiếu thông tin bàn hoặc danh sách món!' });
//     }
//
//     try {
//         const totalAmount = items.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);
//
//         const [orderResult] = await db.query(
//             'INSERT INTO orders (table_id, customer_id, total_amount, order_status) VALUES (?, ?, ?, ?)',
//             [table_id, customer_id || null, totalAmount, 'pending']
//         );
//         const orderId = orderResult.insertId;
//
//         for (const item of items) {
//             await db.query(
//                 'INSERT INTO order_items (order_id, item_id, quantity, item_price, note) VALUES (?, ?, ?, ?, ?)',
//                 [orderId, item.item_id, item.quantity, item.item_price, item.note || '']
//             );
//         }
//
//         await db.query('UPDATE tables SET status = "occupied" WHERE table_id = ?', [table_id]);
//         io.emit('table_status_updated', { table_id, status: 'occupied' });
//
//         const [orderDetails] = await db.query(`
//             SELECT o.order_id, o.table_id, t.table_number, o.created_at, o.order_status,
//                    oi.order_item_id, oi.quantity, oi.note, oi.item_status, m.name AS item_name
//             FROM orders o
//             JOIN tables t ON o.table_id = t.table_id
//             JOIN order_items oi ON o.order_id = oi.order_id
//             JOIN menu_items m ON oi.item_id = m.item_id
//             WHERE o.order_id = ?
//         `, [orderId]);
//
//         const newOrderData = {
//             order_id: orderId,
//             table_id: table_id,
//             table_number: orderDetails[0].table_number,
//             created_at: orderDetails[0].created_at,
//             order_status: 'pending',
//             items: orderDetails.map(d => ({
//                 order_item_id: d.order_item_id,
//                 item_name: d.item_name,
//                 quantity: d.quantity,
//                 note: d.note,
//                 item_status: d.item_status
//             }))
//         };
//
//         io.emit('new_order', newOrderData);
//         res.status(201).json({ message: 'Đặt món thành công!', order: newOrderData });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // ======================= 3. ĐIỀU PHỐI BẾP (KDS) =======================
//
// app.get('/api/orders/kitchen', async (req, res) => {
//     try {
//         const [rows] = await db.query(`
//             SELECT o.order_id, o.table_id, t.table_number, o.created_at, o.order_status,
//                    oi.order_item_id, oi.quantity, oi.note, oi.item_status, m.name AS item_name
//             FROM orders o
//             JOIN tables t ON o.table_id = t.table_id
//             JOIN order_items oi ON o.order_id = oi.order_id
//             JOIN menu_items m ON oi.item_id = m.item_id
//             WHERE o.order_status IN ('pending', 'preparing')
//             ORDER BY o.created_at ASC
//         `);
//         res.json(rows);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.patch('/api/orders/item-status', async (req, res) => {
//     const { order_item_id, status } = req.body;
//     try {
//         await db.query('UPDATE order_items SET item_status = ? WHERE order_item_id = ?', [status, order_item_id]);
//         io.emit('item_status_updated', { order_item_id, status });
//         res.json({ message: 'Cập nhật món thành công!' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.patch('/api/orders/batch-status', async (req, res) => {
//     const { order_id, status } = req.body;
//     try {
//         await db.query('UPDATE order_items SET item_status = ? WHERE order_id = ?', [status, order_id]);
//         io.emit('batch_status_updated', { order_id, status });
//         res.json({ message: 'Cập nhật toàn bộ vé bàn thành công!' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // ======================= 4. QUẦY THU NGÂN & THANH TOÁN (POS) =======================
//
// app.get('/api/billing/tables', async (req, res) => {
//     try {
//         const [tables] = await db.query(`
//             SELECT t.table_id, t.table_number, t.capacity, t.status,
//                    IFNULL(SUM(CASE WHEN o.order_status = 'pending' THEN o.total_amount ELSE 0 END), 0) AS current_total
//             FROM tables t
//             LEFT JOIN orders o ON t.table_id = o.table_id
//             GROUP BY t.table_id, t.table_number, t.capacity, t.status
//             ORDER BY t.table_id ASC
//         `);
//         res.json(tables);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Lấy bill (kèm vat_rate của từng món để phân loại thuế 8% / 10%)
// app.get('/api/billing/table/:tableId', async (req, res) => {
//     const { tableId } = req.params;
//     try {
//         const [items] = await db.query(`
//             SELECT oi.order_item_id, oi.quantity, oi.item_price, oi.note, oi.item_status,
//                    m.name AS item_name, IFNULL(m.vat_rate, 8) AS vat_rate, o.order_id, o.created_at,
//                    c.customer_id, c.full_name AS customer_name, c.phone AS customer_phone, c.points
//             FROM orders o
//             JOIN order_items oi ON o.order_id = oi.order_id
//             JOIN menu_items m ON oi.item_id = m.item_id
//             LEFT JOIN customers c ON o.customer_id = c.customer_id
//             WHERE o.table_id = ? AND o.order_status = 'pending'
//             ORDER BY o.created_at ASC
//         `, [tableId]);
//         res.json(items);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Thanh toán hóa đơn: Trừ điểm tiêu, cộng điểm mới VÀ TỰ ĐỘNG TRỪ KHO NGUYÊN LIỆU THEO CÔNG THỨC
// app.post('/api/billing/checkout', async (req, res) => {
//     const { table_id, points_used = 0 } = req.body;
//
//     try {
//         const [orders] = await db.query(`
//             SELECT customer_id, SUM(total_amount) AS total
//             FROM orders
//             WHERE table_id = ? AND order_status = 'pending'
//             GROUP BY customer_id
//         `, [table_id]);
//
//         if (orders.length > 0 && orders[0].customer_id) {
//             const customerId = orders[0].customer_id;
//             const ptsUsed = Number(points_used) || 0;
//
//             const [cust] = await db.query('SELECT points FROM customers WHERE customer_id = ?', [customerId]);
//             const currentPoints = cust[0]?.points || 0;
//
//             if (ptsUsed > currentPoints) {
//                 return res.status(400).json({ error: 'Số điểm sử dụng vượt quá số điểm hiện có!' });
//             }
//
//             const discountAmount = ptsUsed * 10000;
//             const subTotal = Number(orders[0].total);
//             const vatAmount = Math.round(subTotal * 0.08);
//             const finalPay = Math.max(0, (subTotal + vatAmount) - discountAmount);
//             const earnedPoints = Math.floor(finalPay / 100000);
//
//             await db.query(
//                 'UPDATE customers SET points = points - ? + ? WHERE customer_id = ?',
//                 [ptsUsed, earnedPoints, customerId]
//             );
//         }
//
//         // TỰ ĐỘNG TRỪ HAO TỒN KHO NGUYÊN VẬT LIỆU THEO CÔNG THỨC ĐỊNH LƯỢNG
//         await db.query(`
//             UPDATE ingredients ig
//             JOIN menu_recipes r ON ig.ingredient_id = r.ingredient_id
//             JOIN order_items oi ON r.item_id = oi.item_id
//             JOIN orders o ON oi.order_id = o.order_id
//             SET ig.stock_quantity = GREATEST(0, ig.stock_quantity - (oi.quantity * r.amount_needed))
//             WHERE o.table_id = ? AND o.order_status = 'pending'
//         `, [table_id]);
//
//         await db.query(`UPDATE orders SET order_status = 'paid' WHERE table_id = ? AND order_status = 'pending'`, [table_id]);
//         await db.query('UPDATE tables SET status = "available" WHERE table_id = ?', [table_id]);
//         io.emit('table_status_updated', { table_id, status: 'available' });
//
//         res.json({ message: 'Thanh toán thành công và đã tự động xuất trừ kho nguyên liệu!' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // ======================= 5. QUẢN LÝ KHO & NGUYÊN LIỆU =======================
//
// // Lấy danh sách tồn kho nguyên vật liệu
// app.get('/api/inventory', async (req, res) => {
//     try {
//         const [rows] = await db.query(`
//             SELECT *,
//                    (stock_quantity <= min_stock) AS is_low_stock
//             FROM ingredients
//             ORDER BY is_low_stock DESC, name ASC
//         `);
//         res.json(rows);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // Nhập thêm nguyên liệu vào kho
// app.post('/api/inventory/import', async (req, res) => {
//     const { ingredient_id, amount, cost_price } = req.body;
//     try {
//         await db.query(`
//             UPDATE ingredients
//             SET stock_quantity = stock_quantity + ?,
//                 cost_price = IF(? > 0, ?, cost_price)
//             WHERE ingredient_id = ?
//         `, [amount, cost_price || 0, cost_price || 0, ingredient_id]);
//         res.json({ message: 'Nhập kho thành công!' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // ======================= 6. DASHBOARD THỐNG KÊ LỜI / LỖ =======================
//
// app.get('/api/admin/dashboard-stats', async (req, res) => {
//     try {
//         // 1. Doanh thu bán hàng
//         const [revenueRows] = await db.query(`SELECT IFNULL(SUM(total_amount), 0) AS total_revenue FROM orders WHERE order_status = 'paid'`);
//         const total_revenue = Number(revenueRows[0].total_revenue);
//
//         // 2. Tổng giá vốn nguyên vật liệu đã xuất kho (COGS - Cost of Goods Sold)
//         const [cogsRows] = await db.query(`
//             SELECT IFNULL(SUM(oi.quantity * r.amount_needed * ig.cost_price), 0) AS total_cost
//             FROM orders o
//             JOIN order_items oi ON o.order_id = oi.order_id
//             JOIN menu_recipes r ON oi.item_id = r.item_id
//             JOIN ingredients ig ON r.ingredient_id = ig.ingredient_id
//             WHERE o.order_status = 'paid'
//         `);
//         const total_cost = Number(cogsRows[0].total_cost);
//         const gross_profit = total_revenue - total_cost; // Lợi nhuận gộp (Lời / Lỗ)
//
//         // 3. Số liệu vận hành
//         const [orderCountRows] = await db.query(`SELECT COUNT(*) AS total_paid_orders FROM orders WHERE order_status = 'paid'`);
//         const [customerRows] = await db.query(`SELECT COUNT(*) AS total_customers FROM customers`);
//         const [activeTableRows] = await db.query(`SELECT COUNT(*) AS active_tables FROM tables WHERE status = 'occupied'`);
//
//         // 4. Cảnh báo nguyên liệu sắp hết kho
//         const [lowStockRows] = await db.query(`SELECT COUNT(*) AS low_stock_count FROM ingredients WHERE stock_quantity <= min_stock`);
//
//         // 5. Top 5 món bán chạy nhất
//         const [topItems] = await db.query(`
//             SELECT m.name AS item_name,
//                    IFNULL(SUM(oi.quantity), 0) AS total_sold,
//                    IFNULL(SUM(oi.quantity * oi.item_price), 0) AS total_money
//             FROM order_items oi
//             JOIN menu_items m ON oi.item_id = m.item_id
//             JOIN orders o ON oi.order_id = o.order_id
//             WHERE o.order_status = 'paid'
//             GROUP BY m.item_id, m.name
//             ORDER BY total_sold DESC
//             LIMIT 5
//         `);
//
//         // 6. Doanh số theo ngày
//         const [recentSales] = await db.query(`
//             SELECT DATE_FORMAT(created_at, '%d/%m') AS sale_date,
//                    IFNULL(SUM(total_amount), 0) AS daily_revenue
//             FROM orders
//             WHERE order_status = 'paid'
//             GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%d/%m')
//             ORDER BY DATE(created_at) DESC
//             LIMIT 7
//         `);
//
//         res.json({
//             total_revenue,
//             total_cost,
//             gross_profit,
//             low_stock_count: Number(lowStockRows[0].low_stock_count),
//             total_paid_orders: Number(orderCountRows[0].total_paid_orders),
//             total_customers: Number(customerRows[0].total_customers),
//             active_tables: Number(activeTableRows[0].active_tables),
//             top_items: topItems,
//             recent_sales: recentSales.reverse()
//         });
//     } catch (err) {
//         console.error('Lỗi thống kê:', err);
//         res.status(500).json({ error: err.message });
//     }
// });
//
// // ======================= 7. SOCKET.IO & GỌI PHỤC VỤ =======================
//
// io.on('connection', (socket) => {
//     socket.emit('current_service_requests', serviceRequests);
//
//     socket.on('call_service', (data) => {
//         const newRequest = {
//             id: Date.now(),
//             table_number: data.table_number || 'Bàn 05',
//             type: data.type,
//             created_at: new Date()
//         };
//         serviceRequests.unshift(newRequest);
//         io.emit('new_service_request', newRequest);
//     });
//
//     socket.on('resolve_service', (requestId) => {
//         serviceRequests = serviceRequests.filter(req => req.id !== requestId);
//         io.emit('service_resolved', requestId);
//     });
// });
//
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//     console.log(`Backend server đang chạy tại: http://localhost:${PORT}`);
// });

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

let serviceRequests = [];

// ======================= 1. XÁC THỰC & PHÂN QUYỀN =======================

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu!' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác!' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác!' });
        }

        res.json({
            message: 'Đăng nhập thành công!',
            user: {
                id: user.user_id,
                username: user.username,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/customer/register', async (req, res) => {
    const { phone, full_name, password } = req.body;
    if (!phone || !full_name || !password) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên, SĐT và mật khẩu!' });
    }

    try {
        const [exist] = await db.query('SELECT customer_id FROM customers WHERE phone = ?', [phone]);
        if (exist.length > 0) {
            return res.status(400).json({ error: 'Số điện thoại này đã được đăng ký!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO customers (phone, full_name, password, points) VALUES (?, ?, ?, 0)',
            [phone, full_name, hashedPassword]
        );

        res.status(201).json({
            message: 'Đăng ký thành công!',
            customer: { id: result.insertId, phone, full_name, points: 0 }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/customer/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM customers WHERE phone = ?', [phone]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Số điện thoại chưa đăng ký hội viên!' });
        }

        const customer = rows[0];
        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Mật khẩu không chính xác!' });
        }

        res.json({
            message: 'Đăng nhập tích điểm thành công!',
            customer: {
                id: customer.customer_id,
                phone: customer.phone,
                full_name: customer.full_name,
                points: customer.points
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======================= 2. THỰC ĐƠN & GỌI MÓN =======================

app.get('/api/menu', async (req, res) => {
    const { all } = req.query;
    try {
        const query = all === 'true'
            ? `SELECT m.*, c.category_name FROM menu_items m LEFT JOIN categories c ON m.category_id = c.category_id ORDER BY m.item_id DESC`
            : `SELECT m.*, c.category_name FROM menu_items m LEFT JOIN categories c ON m.category_id = c.category_id WHERE m.is_available = TRUE ORDER BY m.item_id ASC`;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/menu', async (req, res) => {
    const { name, category_id, price, vat_rate, portion_type, portion_desc, large_price, image_url, badge } = req.body;
    try {
        await db.query(`
            INSERT INTO menu_items (name, category_id, price, vat_rate, portion_type, portion_desc, large_price, image_url, badge, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [name, category_id || 1, price, vat_rate || 8, portion_type || 'fixed', portion_desc || '', large_price || null, image_url, badge || 'none']);
        res.status(201).json({ message: 'Thêm món mới thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/menu/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category_id, price, vat_rate, portion_type, portion_desc, large_price, image_url, badge } = req.body;
    try {
        await db.query(`
            UPDATE menu_items 
            SET name = ?, category_id = ?, price = ?, vat_rate = ?, portion_type = ?, portion_desc = ?, large_price = ?, image_url = ?, badge = ?
            WHERE item_id = ?
        `, [name, category_id || 1, price, vat_rate || 8, portion_type, portion_desc, large_price || null, image_url, badge, id]);
        res.json({ message: 'Cập nhật món thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/admin/menu/:id/toggle-status', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`UPDATE menu_items SET is_available = NOT is_available WHERE item_id = ?`, [id]);
        res.json({ message: 'Đã cập nhật trạng thái món!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/menu/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM menu_items WHERE item_id = ?`, [id]);
        res.json({ message: 'Đã xóa món thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const { table_id, items, customer_id } = req.body;
    if (!table_id || !items || items.length === 0) {
        return res.status(400).json({ error: 'Thiếu thông tin bàn hoặc danh sách món!' });
    }

    try {
        const totalAmount = items.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);

        const [orderResult] = await db.query(
            'INSERT INTO orders (table_id, customer_id, total_amount, order_status) VALUES (?, ?, ?, ?)',
            [table_id, customer_id || null, totalAmount, 'pending']
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            await db.query(
                'INSERT INTO order_items (order_id, item_id, quantity, item_price, note) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.item_id, item.quantity, item.item_price, item.note || '']
            );
        }

        await db.query('UPDATE tables SET status = "occupied" WHERE table_id = ?', [table_id]);
        io.emit('table_status_updated', { table_id, status: 'occupied' });

        const [orderDetails] = await db.query(`
            SELECT o.order_id, o.table_id, t.table_number, o.created_at, o.order_status,
                   oi.order_item_id, oi.quantity, oi.note, oi.item_status, m.name AS item_name
            FROM orders o
            JOIN tables t ON o.table_id = t.table_id
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN menu_items m ON oi.item_id = m.item_id
            WHERE o.order_id = ?
        `, [orderId]);

        const newOrderData = {
            order_id: orderId,
            table_id: table_id,
            table_number: orderDetails[0].table_number,
            created_at: orderDetails[0].created_at,
            order_status: 'pending',
            items: orderDetails.map(d => ({
                order_item_id: d.order_item_id,
                item_name: d.item_name,
                quantity: d.quantity,
                note: d.note,
                item_status: d.item_status
            }))
        };

        io.emit('new_order', newOrderData);
        res.status(201).json({ message: 'Đặt món thành công!', order: newOrderData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======================= 3. ĐIỀU PHỐI BẾP (KDS) =======================

app.get('/api/orders/kitchen', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT o.order_id, o.table_id, t.table_number, o.created_at, o.order_status,
                   oi.order_item_id, oi.quantity, oi.note, oi.item_status, m.name AS item_name
            FROM orders o
            JOIN tables t ON o.table_id = t.table_id
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN menu_items m ON oi.item_id = m.item_id
            WHERE o.order_status IN ('pending', 'preparing')
            ORDER BY o.created_at ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/orders/item-status', async (req, res) => {
    const { order_item_id, status } = req.body;
    try {
        await db.query('UPDATE order_items SET item_status = ? WHERE order_item_id = ?', [status, order_item_id]);
        io.emit('item_status_updated', { order_item_id, status });
        res.json({ message: 'Cập nhật món thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/orders/batch-status', async (req, res) => {
    const { order_id, status } = req.body;
    try {
        await db.query('UPDATE order_items SET item_status = ? WHERE order_id = ?', [status, order_id]);
        io.emit('batch_status_updated', { order_id, status });
        res.json({ message: 'Cập nhật toàn bộ vé bàn thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======================= 4. QUẦY THU NGÂN & THANH TOÁN (POS) =======================

app.get('/api/billing/tables', async (req, res) => {
    try {
        const [tables] = await db.query(`
            SELECT t.table_id, t.table_number, t.capacity, t.status,
                   IFNULL(SUM(CASE WHEN o.order_status = 'pending' THEN o.total_amount ELSE 0 END), 0) AS current_total
            FROM tables t
            LEFT JOIN orders o ON t.table_id = o.table_id
            GROUP BY t.table_id, t.table_number, t.capacity, t.status
            ORDER BY t.table_id ASC
        `);
        res.json(tables);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/billing/table/:tableId', async (req, res) => {
    const { tableId } = req.params;
    try {
        const [items] = await db.query(`
            SELECT oi.order_item_id, oi.quantity, oi.item_price, oi.note, oi.item_status,
                   m.name AS item_name, IFNULL(m.vat_rate, 8) AS vat_rate, o.order_id, o.created_at,
                   c.customer_id, c.full_name AS customer_name, c.phone AS customer_phone, c.points
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN menu_items m ON oi.item_id = m.item_id
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.table_id = ? AND o.order_status = 'pending'
            ORDER BY o.created_at ASC
        `, [tableId]);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/billing/checkout', async (req, res) => {
    const { table_id, points_used = 0 } = req.body;

    try {
        const [orders] = await db.query(`
            SELECT customer_id, SUM(total_amount) AS total 
            FROM orders 
            WHERE table_id = ? AND order_status = 'pending'
            GROUP BY customer_id
        `, [table_id]);

        if (orders.length > 0 && orders[0].customer_id) {
            const customerId = orders[0].customer_id;
            const ptsUsed = Number(points_used) || 0;

            const [cust] = await db.query('SELECT points FROM customers WHERE customer_id = ?', [customerId]);
            const currentPoints = cust[0]?.points || 0;

            if (ptsUsed > currentPoints) {
                return res.status(400).json({ error: 'Số điểm sử dụng vượt quá số điểm hiện có!' });
            }

            const discountAmount = ptsUsed * 10000;
            const subTotal = Number(orders[0].total);
            const vatAmount = Math.round(subTotal * 0.08);
            const finalPay = Math.max(0, (subTotal + vatAmount) - discountAmount);
            const earnedPoints = Math.floor(finalPay / 100000);

            await db.query(
                'UPDATE customers SET points = points - ? + ? WHERE customer_id = ?',
                [ptsUsed, earnedPoints, customerId]
            );
        }

        // Tự động trừ hao tồn kho nguyên vật liệu theo công thức định lượng
        await db.query(`
            UPDATE ingredients ig
            JOIN menu_recipes r ON ig.ingredient_id = r.ingredient_id
            JOIN order_items oi ON r.item_id = oi.item_id
            JOIN orders o ON oi.order_id = o.order_id
            SET ig.stock_quantity = GREATEST(0, ig.stock_quantity - (oi.quantity * r.amount_needed))
            WHERE o.table_id = ? AND o.order_status = 'pending'
        `, [table_id]);

        await db.query(`UPDATE orders SET order_status = 'paid' WHERE table_id = ? AND order_status = 'pending'`, [table_id]);
        await db.query('UPDATE tables SET status = "available" WHERE table_id = ?', [table_id]);
        io.emit('table_status_updated', { table_id, status: 'available' });

        res.json({ message: 'Thanh toán thành công và đã tự động xuất trừ kho nguyên liệu!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ======================= 5. QUẢN LÝ KHO & ĐỊNH LƯỢNG (CRUD) =======================

// Lấy danh sách tồn kho
app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT *, 
                   (stock_quantity <= min_stock) AS is_low_stock 
            FROM ingredients 
            ORDER BY is_low_stock DESC, name ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Thêm nguyên liệu mới vào kho
app.post('/api/inventory', async (req, res) => {
    const { name, unit, stock_quantity, cost_price, min_stock } = req.body;
    if (!name || !unit || cost_price === undefined) {
        return res.status(400).json({ error: 'Vui lòng nhập tên, đơn vị và giá vốn nguyên liệu!' });
    }

    try {
        await db.query(`
            INSERT INTO ingredients (name, unit, stock_quantity, cost_price, min_stock)
            VALUES (?, ?, ?, ?, ?)
        `, [name, unit, stock_quantity || 0, cost_price, min_stock || 5]);
        res.status(201).json({ message: 'Thêm nguyên liệu vào kho thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chỉnh sửa thông tin nguyên liệu
app.put('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    const { name, unit, stock_quantity, cost_price, min_stock } = req.body;
    try {
        await db.query(`
            UPDATE ingredients
            SET name = ?, unit = ?, stock_quantity = ?, cost_price = ?, min_stock = ?
            WHERE ingredient_id = ?
        `, [name, unit, stock_quantity, cost_price, min_stock, id]);
        res.json({ message: 'Cập nhật nguyên liệu thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Xóa nguyên liệu khỏi kho
app.delete('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM ingredients WHERE ingredient_id = ?', [id]);
        res.json({ message: 'Đã xóa nguyên liệu!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Nhập thêm hàng vào kho
app.post('/api/inventory/import', async (req, res) => {
    const { ingredient_id, amount, cost_price } = req.body;
    try {
        await db.query(`
            UPDATE ingredients 
            SET stock_quantity = stock_quantity + ?,
                cost_price = IF(? > 0, ?, cost_price)
            WHERE ingredient_id = ?
        `, [amount, cost_price || 0, cost_price || 0, ingredient_id]);
        res.json({ message: 'Nhập kho thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy danh sách công thức định lượng (BOM)
app.get('/api/inventory/recipes', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.recipe_id, r.amount_needed,
                   m.item_id, m.name AS item_name,
                   ig.ingredient_id, ig.name AS ingredient_name, ig.unit
            FROM menu_recipes r
            JOIN menu_items m ON r.item_id = m.item_id
            JOIN ingredients ig ON r.ingredient_id = ig.ingredient_id
            ORDER BY m.name ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Thêm định lượng món mới (Gắn món A cần bao nhiêu nguyên liệu B)
app.post('/api/inventory/recipes', async (req, res) => {
    const { item_id, ingredient_id, amount_needed } = req.body;
    if (!item_id || !ingredient_id || !amount_needed) {
        return res.status(400).json({ error: 'Vui lòng chọn món, nguyên liệu và định lượng cần!' });
    }

    try {
        await db.query(`
            INSERT INTO menu_recipes (item_id, ingredient_id, amount_needed)
            VALUES (?, ?, ?)
        `, [item_id, ingredient_id, amount_needed]);
        res.status(201).json({ message: 'Thêm định lượng món thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Xóa định lượng món
app.delete('/api/inventory/recipes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM menu_recipes WHERE recipe_id = ?', [id]);
        res.json({ message: 'Đã xóa định lượng!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======================= 6. DASHBOARD THỐNG KÊ LỜI / LỖ =======================

app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        const [revenueRows] = await db.query(`SELECT IFNULL(SUM(total_amount), 0) AS total_revenue FROM orders WHERE order_status = 'paid'`);
        const total_revenue = Number(revenueRows[0].total_revenue);

        const [cogsRows] = await db.query(`
            SELECT IFNULL(SUM(oi.quantity * r.amount_needed * ig.cost_price), 0) AS total_cost
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN menu_recipes r ON oi.item_id = r.item_id
            JOIN ingredients ig ON r.ingredient_id = ig.ingredient_id
            WHERE o.order_status = 'paid'
        `);
        const total_cost = Number(cogsRows[0].total_cost);
        const gross_profit = total_revenue - total_cost;

        const [orderCountRows] = await db.query(`SELECT COUNT(*) AS total_paid_orders FROM orders WHERE order_status = 'paid'`);
        const [customerRows] = await db.query(`SELECT COUNT(*) AS total_customers FROM customers`);
        const [activeTableRows] = await db.query(`SELECT COUNT(*) AS active_tables FROM tables WHERE status = 'occupied'`);
        const [lowStockRows] = await db.query(`SELECT COUNT(*) AS low_stock_count FROM ingredients WHERE stock_quantity <= min_stock`);

        const [topItems] = await db.query(`
            SELECT m.name AS item_name, 
                   IFNULL(SUM(oi.quantity), 0) AS total_sold,
                   IFNULL(SUM(oi.quantity * oi.item_price), 0) AS total_money
            FROM order_items oi
            JOIN menu_items m ON oi.item_id = m.item_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.order_status = 'paid'
            GROUP BY m.item_id, m.name
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        const [recentSales] = await db.query(`
            SELECT DATE_FORMAT(created_at, '%d/%m') AS sale_date,
                   IFNULL(SUM(total_amount), 0) AS daily_revenue
            FROM orders
            WHERE order_status = 'paid'
            GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%d/%m')
            ORDER BY DATE(created_at) DESC
            LIMIT 7
        `);

        res.json({
            total_revenue,
            total_cost,
            gross_profit,
            low_stock_count: Number(lowStockRows[0].low_stock_count),
            total_paid_orders: Number(orderCountRows[0].total_paid_orders),
            total_customers: Number(customerRows[0].total_customers),
            active_tables: Number(activeTableRows[0].active_tables),
            top_items: topItems,
            recent_sales: recentSales.reverse()
        });
    } catch (err) {
        console.error('Lỗi thống kê:', err);
        res.status(500).json({ error: err.message });
    }
});

// ======================= 7. SOCKET.IO =======================

io.on('connection', (socket) => {
    socket.emit('current_service_requests', serviceRequests);

    socket.on('call_service', (data) => {
        const newRequest = {
            id: Date.now(),
            table_number: data.table_number || 'Bàn 05',
            type: data.type,
            created_at: new Date()
        };
        serviceRequests.unshift(newRequest);
        io.emit('new_service_request', newRequest);
    });

    socket.on('resolve_service', (requestId) => {
        serviceRequests = serviceRequests.filter(req => req.id !== requestId);
        io.emit('service_resolved', requestId);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Backend server đang chạy tại: http://localhost:${PORT}`);
});