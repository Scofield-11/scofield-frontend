import React from 'react';

function ExamEditForm({ editTitle, setEditTitle, editQuestions, handleDeleteQuestion, handleUpdateQuestion, handleAddNewQuestionToEdit, setShowImportModal, handleSaveEdit, setEditingExamId }) {
  return (
    <div className="card shadow border-warning mb-5">
      <div className="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
        <span className="fs-5">Chỉnh sửa bài thi (Tổng: {editQuestions.length} câu)</span>
        <button className="btn btn-sm btn-dark" onClick={() => setEditingExamId(null)}>Đóng lại</button>
      </div>
      <div className="card-body bg-light">
        <input className="form-control form-control-lg mb-4 fw-bold text-primary" placeholder="Tên bài thi..." value={editTitle} onChange={e => setEditTitle(e.target.value)} />
        {editQuestions.map((q, idx) => (
          <div key={idx} className="card mb-3 border-secondary shadow-sm" style={{ transform: 'none' }}>
            <div className="card-header bg-white d-flex justify-content-between py-2">
              <span className="fw-bold">Câu {idx + 1}</span>
              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteQuestion(idx)}>Xóa câu này</button>
            </div>
            <div className="card-body">
              <input className="form-control mb-3" placeholder="Nội dung câu hỏi..." value={q.question} onChange={e => handleUpdateQuestion(idx, 'question', e.target.value)} />
              <div className="row g-2 mb-3">
                {[0, 1, 2, 3].map(optIdx => (
                  <div className="col-md-6" key={optIdx}>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text fw-bold">Đ.án {optIdx + 1}</span>
                      <input className="form-control" value={q.options[optIdx]} onChange={e => handleUpdateQuestion(idx, `opt${optIdx + 1}`, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="d-flex align-items-center">
                <label className="me-2 fw-bold text-success">Đáp án đúng nằm ở vị trí số:</label>
                <select className="form-select form-select-sm w-auto border-success" value={q.correct_ans} onChange={e => handleUpdateQuestion(idx, 'correct_ans', parseInt(e.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        
        <div className="d-flex gap-2 mb-4">
          <button className="btn btn-outline-secondary flex-grow-1 border-dashed py-2" onClick={handleAddNewQuestionToEdit}>
            + Thêm 1 câu hỏi trống
          </button>
          <button className="btn btn-outline-primary flex-grow-1 border-dashed py-2 fw-bold" onClick={() => setShowImportModal(true)}>
            📥 Import thêm nhanh (Paste)
          </button>
        </div>

        <button className="btn btn-success btn-lg w-100 fw-bold" onClick={handleSaveEdit}>LƯU TẤT CẢ CẬP NHẬT</button>
      </div>
    </div>
  );
}

export default ExamEditForm;