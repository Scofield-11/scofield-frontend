# Scofield

Ứng dụng học từ vựng Scofield với giao diện tối ưu và nhiều tính năng tương tác:
- **Quản lý học phần:** Tìm kiếm từ vựng, import nhanh qua văn bản thô, **kéo thả file CSV** và tạo **Thư mục** để sắp xếp.
- **Chế độ học đa dạng:** Flashcards (tích hợp tự động phát âm, sửa nhanh thẻ), Học (trắc nghiệm, tự luận, thuật toán nhắc lại SRS), Ghép thẻ (chế độ Thử thách đếm ngược 60s & tính điểm Combo), Thi trắc nghiệm (Exam).
- **Trải nghiệm người dùng (UX):** Hỗ trợ **Dark/Light Mode**, thanh tiến độ (Progress Bar) toàn cục, hiệu ứng rung lắc báo sai, pháo giấy chúc mừng, Loading Skeleton & Empty State chuyên nghiệp.
- **Dashboard thống kê:** Trực quan hóa dữ liệu học tập và biểu đồ tiến độ điểm số các lần thi.

- **Backend:** FastAPI + SQLAlchemy + Alembic + MySQL (tích hợp Pydantic validation)
- **Frontend:** React (Vite) + React Router + Axios + Bootstrap

Tài liệu này hướng dẫn cài đặt **từ đầu trên một máy hoàn toàn mới** (chưa có Python, Node, MySQL...).

---

## Cấu trúc dự án

```text
scofield/
├── backend/          # Chứa mã nguồn API, cấu hình Database và Migration (Alembic)
├── frontend/         # Chứa mã nguồn giao diện React (Vite)
├── start.bat         # Script khởi động nhanh hệ thống (Chạy Backend + Mở Web)
├── .gitignore        # Cấu hình bỏ qua file rác của Git
└── README.md         # Tài liệu hướng dẫn
```

---

## 1. Cài đặt công cụ nền tảng

Cài lần lượt các phần mềm sau nếu máy chưa có:

| Công cụ | Phiên bản gợi ý | Kiểm tra sau khi cài |
|---|---|---|
| Python | 3.10 – 3.12 | `python --version` |
| Node.js | 18 LTS trở lên (kèm npm) | `node -v` và `npm -v` |
| MySQL Server | 8.0 trở lên | `mysql --version` |
| Git (tuỳ chọn) | mới nhất | `git --version` |

- Python: tải tại python.org/downloads. Khi cài trên Windows, nhớ tick **Add python.exe to PATH**.
- Node.js: tải bản LTS tại nodejs.org.
- MySQL: tải **MySQL Installer** (Windows) hoặc dùng gói `mysql-server` (Linux) tại dev.mysql.com/downloads/installer. Trong lúc cài, đặt mật khẩu cho user `root` và **nhớ lại mật khẩu này**. *(Đảm bảo dịch vụ MySQL đang chạy trên máy).*

Sau khi cài xong, mở terminal/CMD mới rồi gõ 3 lệnh kiểm tra ở bảng trên để chắc chắn đều nhận lệnh.

---

## 2. Tạo cơ sở dữ liệu MySQL

Mở terminal, đăng nhập MySQL bằng user root:

```bash
mysql -u root -p
```

Nhập mật khẩu root đã đặt lúc cài, sau đó tạo database và (khuyến nghị) một user riêng cho ứng dụng:

```sql
CREATE DATABASE scofield CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'scofield_user'@'localhost' IDENTIFIED BY 'MatKhauCuaBan123!';
GRANT ALL PRIVILEGES ON scofield.* TO 'scofield_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

Bạn có thể đổi tên database/user/mật khẩu tuỳ ý, chỉ cần dùng đúng giá trị đó ở bước cấu hình `.env` bên dưới. Không cần tự tạo bảng — Alembic ở bước 3 sẽ tự tạo toàn bộ bảng.

---

## 3. Cài đặt Backend (FastAPI + MySQL)

```bash
cd backend
python -m venv venv
```

Kích hoạt môi trường ảo:

```bash
# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

Cài thư viện:

```bash
pip install -r requirements.txt
```

### Tạo file `.env`

Tạo file `.env` trong thư mục `backend` (cùng cấp với `main.py`) với nội dung sau, thay giá trị theo database bạn tạo ở bước 2:

```env
DB_USER=scofield_user
DB_PASSWORD=MatKhauCuaBan123!
DB_HOST=localhost
DB_PORT=3306
DB_NAME=scofield
```

Đây là các biến mà `database.py` và `alembic/env.py` đọc để dựng chuỗi kết nối `mysql+pymysql://...`.

### Chạy migration để tạo bảng

```bash
alembic upgrade head
```

Lệnh này tạo toàn bộ bảng: `sets`, `vocabularies`, `exams`, `exam_questions`, `exam_histories` dựa theo các revision có sẵn trong `alembic/versions`.

---

## 4. Cài đặt Frontend (React + Vite)

Mở một terminal **mới** (giữ terminal backend đang chạy), rồi:

```bash
cd frontend
npm install
```

### Cấu hình kết nối tới backend

File `src/api/axiosConfig.js` hiện có `baseURL` để trống. Trên máy mới, mở file này và trỏ về backend:

```js
const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});
```

---

## 5. Build frontend để backend tự phục vụ (Bắt buộc nếu dùng start.bat)

Để sử dụng được file `start.bat` khởi động tự động, bạn cần build Frontend:

```bash
cd frontend
npm run build
```

Sau khi build xong sẽ có thư mục `frontend/dist`. Copy thư mục `dist` này vào đúng vị trí mà `backend/main.py` đang trỏ tới (thư mục `dist` cạnh `main.py`). Backend sẽ tự động phục vụ giao diện này tại `http://localhost:8000`.

---

## 6. Tóm tắt lệnh chạy hằng ngày (Khi đã cài xong)

Bạn có 2 cách để chạy ứng dụng:

**Cách 1: Khởi động nhanh bằng Script (Khuyên dùng)**
Nhấp đúp chuột vào file `start.bat` ở thư mục gốc. Hệ thống sẽ tự động bật máy chủ Backend và mở sẵn trình duyệt web cho bạn.

**Cách 2: Chạy thủ công (Dành cho lúc đang lập trình Code)**
```bash
# Terminal 1 - backend
cd backend
venv\Scripts\activate      # hoặc: source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 - frontend
cd frontend
npm run dev
```

---

## 7. Công cụ hỗ trợ khác (tuỳ chọn)

### Xuất mã nguồn dạng markdown bằng Repomix

```bash
npx repomix frontend --style markdown --output repomix-frontend.md
npx repomix backend --style markdown --output repomix-backend.md
```

### Chia sẻ backend ra Internet tạm thời bằng Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:8000
```

---

## 8. Xử lý lỗi thường gặp

- **`ModuleNotFoundError` khi chạy uvicorn:** quên kích hoạt `venv` hoặc quên `pip install -r requirements.txt`.
- **`sqlalchemy.exc.OperationalError: (2003, "Can't connect to MySQL server")`:** MySQL Server chưa bật.
- **`Access denied for user`:** sai `DB_USER`/`DB_PASSWORD` trong `.env`, hoặc chưa `GRANT PRIVILEGES` cho user.
- **Frontend gọi API bị lỗi 404/Network Error:** kiểm tra lại `baseURL` trong `src/api/axiosConfig.js` và backend có đang chạy không.
- **Web chỉ hiện chữ hoặc màn hình trắng (khi chạy cổng 8000):** Bạn chưa copy folder `dist` (đã build) từ `frontend` sang `backend`.
- **Lỗi CORS trên console trình duyệt:** đảm bảo frontend chạy đúng cổng 5173 hoặc 3000, hoặc thêm cổng bạn dùng vào danh sách `origins` trong `backend/main.py`.