import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';
import EmptyState from './EmptyState';

function ExamList({ exams, fetchExamsList, startExam, handleEditClick, handleDeleteExam, isInstantFeedback, setIsInstantFeedback }) {
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !rawText.trim()) return toast.warning("Vui lòng nhập đủ tên và nội dung bài test!");
    try {
      await api.post("/exams/import", { title, raw_text: rawText });
      toast.success("Tạo bài test thành công!");
      setRawText("");
      setTitle("");
      fetchExamsList();
    } catch (error) {
      toast.error("Lỗi import. Vui lòng kiểm tra lại định dạng dấu |");
    }
  };

  return (
    <>
      <div className="card shadow-sm p-4 mb-5 border-0" style={{ transform: 'none' }}>
        <h3 className="mb-3">Tạo bài kiểm tra mới (Dán nhanh)</h3>
        <input className="form-control mb-2" placeholder="Tên bài kiểm tra..." value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="form-control mb-3" rows="3" placeholder="Câu hỏi | Đáp án 1 | Đáp án 2 | Đáp án 3 | Đáp án 4 | 1" value={rawText} onChange={e => setRawText(e.target.value)}></textarea>
        <button className="btn btn-primary w-100" onClick={handleCreate}>Lưu Đề Thi Mới</button>
      </div>

      <h4 className="mb-3">Danh sách bài kiểm tra</h4>
      {exams.length === 0 ? (
        <EmptyState title="Chưa có bài kiểm tra" message="Hãy tạo bài kiểm tra mới bằng cách điền thông tin phía trên nhé." />
      ) : (
      <div className="row mb-5">
        {exams.map(exam => (
          <div className="col-md-6 mb-3" key={exam.id}>
            <div className="card shadow-sm border-0 h-100" style={{ transform: 'none' }}>
              <div className="card-body d-flex flex-column justify-content-between">
                <h5 className="card-title text-primary">{exam.title}</h5>
                <div>
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-outline-primary flex-grow-1" onClick={() => startExam(exam.id)}>Làm bài</button>
                    <button className="btn btn-outline-secondary" onClick={() => handleEditClick(exam.id)}>Sửa</button>
                    <button className="btn btn-outline-danger" onClick={() => handleDeleteExam(exam.id)}>Xóa</button>
                  </div>
                  <div className="form-check form-switch mt-3">
                    <input className="form-check-input" type="checkbox" id={`switch-${exam.id}`} checked={isInstantFeedback} onChange={() => setIsInstantFeedback(!isInstantFeedback)} />
                    <label className="form-check-label text-primary" htmlFor={`switch-${exam.id}`} style={{fontSize: '0.9rem'}}>Hiện đáp án ngay khi chọn</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </>
  );
}

export default ExamList;