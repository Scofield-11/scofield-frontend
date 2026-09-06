import React from 'react';

function ExamImportModal({ show, onClose, importText, setImportText, onImport }) {
  if (!show) return null;
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, padding: '10px' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-md-down">
        <div className="modal-content shadow-lg border-0 h-100">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold">📥 Import thêm hàng loạt</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body bg-light">
            <p className="text-muted small mb-2">
              Dán danh sách câu hỏi theo định dạng: <br/>
              <code>Câu hỏi | Đáp án 1 | Đáp án 2 | Đáp án 3 | Đáp án 4 | Vị trí đúng</code>
            </p>
            <textarea 
              className="form-control mb-3" 
              rows="8" 
              placeholder="Câu hỏi 1 | A | B | C | D | 1&#10;Câu hỏi 2 | A | B | C | D | 3"
              value={importText} 
              onChange={e => setImportText(e.target.value)}
            ></textarea>
            <button className="btn btn-success w-100 fw-bold btn-lg" onClick={onImport}>Gộp vào đề này</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamImportModal;