import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="container text-center mt-5">
      <h1 className="display-1 fw-bold text-primary" style={{ fontSize: '6rem' }}>404</h1>
      <h3 className="mb-4 fw-bold text-dark">Trang không tồn tại</h3>
      <p className="text-muted mb-5 fs-5">Đường dẫn bạn truy cập không đúng hoặc đã bị xóa khỏi hệ thống.</p>
      <Link to="/" className="btn btn-primary px-5 py-3 fw-bold rounded-pill shadow-sm">
        ← Quay lại Trang chủ
      </Link>
    </div>
  );
}

export default NotFound;