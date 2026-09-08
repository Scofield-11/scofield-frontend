import React from 'react';
import SetSelector from './SetSelector';
import ContentTypeSelector from './ContentTypeSelector';

function TestSetup({ sets, kanjiSets, contentType, setContentType, selectedSetId, setSelectedSetId, questionCount, setQuestionCount, poolSize, questionFormat, setQuestionFormat, isReversed, setIsReversed, generateTest }) {
  const getFrontLabel = () => isReversed ? 'Ý nghĩa' : (contentType === 'kanji' ? 'Kanji' : 'Từ vựng');
  const getBackLabel = () => isReversed ? (contentType === 'kanji' ? 'Kanji' : 'Từ vựng') : 'Ý nghĩa';

  return (
    <div className="container mt-5 fade-in-slide" style={{ maxWidth: '650px' }}>
      <div className="card shadow-sm border-0 p-4 p-md-5 rounded-4 bg-white" style={{ borderRadius: '24px' }}>
        <h3 className="text-center mb-5 fw-bold text-dark">Thiết lập Bài Thi</h3>
        
        <div className="mb-4">
          <label className="form-label fw-bold text-muted mb-2">1. Chọn loại nội dung:</label>
          <ContentTypeSelector contentType={contentType} setContentType={setContentType} />
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold text-muted mb-2">2. Chọn học phần:</label>
          <SetSelector sets={contentType === 'kanji' ? kanjiSets : sets} selectedSetId={selectedSetId} setSelectedSetId={setSelectedSetId} />
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6">
            <label className="form-label fw-bold text-muted">Số lượng câu hỏi:</label>
            <input 
              type="number" 
              className="form-control form-control-lg bg-light border-0 fw-bold text-dark shadow-sm" 
              style={{ borderRadius: '12px', height: '56px' }}
              value={questionCount} 
              onChange={(e) => setQuestionCount(Number(e.target.value))} 
              max={poolSize}
              min={1}
            />
            <small className="text-muted d-block mt-1">Tối đa {poolSize} câu.</small>
          </div>
          <div className="col-6">
            <label className="form-label fw-bold text-muted">Hình thức thi:</label>
            <select 
              className="form-select form-select-lg bg-light border-0 fw-bold text-dark shadow-sm" 
              style={{ borderRadius: '12px', height: '56px' }}
              value={questionFormat} 
              onChange={(e) => setQuestionFormat(e.target.value)}
            >
              <option value="choice">100% Trắc nghiệm</option>
              <option value="typing">100% Tự luận</option>
              <option value="mixed">Hỗn hợp (50/50)</option>
            </select>
          </div>
        </div>

        

        <div className="d-flex align-items-center justify-content-between bg-light p-3 rounded-4 border-0 mb-5 shadow-sm transition-all">
            <div className="text-center" style={{ flex: 1, minWidth: 0 }}>
              <span className="text-muted small fw-bold d-block mb-1 text-truncate">HỆ THỐNG HỎI</span>
              <span className="fw-bold fs-5 text-truncate d-block" style={{ color: '#8a2be2' }}>{getFrontLabel()}</span>
            </div>
            
            <div className="px-2 px-md-3" style={{ flexShrink: 0 }}>
              <button 
                type="button"
                className="btn btn-warning rounded-circle shadow-sm fw-bold d-flex align-items-center justify-content-center transition-all hover-scale m-0" 
                style={{width: '48px', height: '48px', fontSize: '1.2rem'}}
                onClick={() => setIsReversed(!isReversed)}
                title="Đảo chiều câu hỏi"
              >
                🔄
              </button>
            </div>
            
            <div className="text-center" style={{ flex: 1, minWidth: 0 }}>
              <span className="text-muted small fw-bold d-block mb-1 text-truncate">BẠN TRẢ LỜI</span>
              <span className="fw-bold text-success fs-5 text-truncate d-block">{getBackLabel()}</span>
            </div>
          </div>

        <button className="btn btn-primary btn-lg w-100 fw-bold shadow-lg" style={{ borderRadius: '14px', padding: '15px', backgroundColor: '#8a2be2', border: 'none' }} onClick={generateTest}>
          Bắt đầu làm bài 🚀
        </button>
      </div>
    </div>
  );
}

export default TestSetup;