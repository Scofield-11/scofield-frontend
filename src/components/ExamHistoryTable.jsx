import React from 'react';
import EmptyState from './EmptyState';

function ExamHistoryTable({ history, setViewHistory, handleClearHistory }) {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
        <h4 className="m-0 fw-bold">Lịch sử làm bài</h4>
        {history.length > 0 && (
          <button className="btn btn-outline-danger btn-sm rounded-pill fw-bold px-3 shadow-sm hover-bg-danger hover-text-white transition-all" onClick={handleClearHistory}>
            🗑️ Xóa lịch sử
          </button>
        )}
      </div>
      
      {history.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu" message="Lịch sử làm bài thi của bạn sẽ được hiển thị tại đây." />
      ) : (
        <div className="card shadow-sm border-0 mb-5 rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3">Tên bài thi</th>
                  <th className="py-3 text-center">Kết quả</th>
                  <th className="py-3 px-4 text-end">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id} style={{ cursor: 'pointer' }} onClick={() => setViewHistory(record)}>
                    <td className="text-muted small px-4">{record.date}</td>
                    <td className="fw-bold">{record.title}</td>
                    <td className="text-center">
                      <span className={`badge rounded-pill px-3 py-2 ${record.score === record.total ? 'bg-success' : 'bg-primary'}`}>
                        {record.score} / {record.total}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <button className="btn btn-sm btn-outline-info fw-bold rounded-pill px-3 transition-all hover-scale" onClick={(e) => { e.stopPropagation(); setViewHistory(record); }}>
                        Xem lại
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default ExamHistoryTable;