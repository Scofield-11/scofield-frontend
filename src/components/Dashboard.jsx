import React, { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { VocabContext } from '../context/VocabContext';
import LoadingSkeleton from './LoadingSkeleton';

function Dashboard() {
  const { sets, globalStats, loading, fetchSets, fetchGlobalStats } = useContext(VocabContext);

  useEffect(() => {
    fetchSets();
    fetchGlobalStats();
  }, [fetchSets, fetchGlobalStats]);

  if (loading) return <LoadingSkeleton />;

  // Lọc ra các học phần thực tế (bỏ qua học phần ảo dùng để giữ folder)
  const realSetsCount = sets.filter(set => !set.title.startsWith('_Thư mục:')).length;

  return (
    <div className="container-fluid mt-2 mb-4 mx-auto" style={{ maxWidth: '1000px' }}>
      <div className="row g-4 fade-in-slide align-items-stretch">
        
        {/* Banner Chính */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 bg-primary text-white h-100 position-relative overflow-hidden p-3">
            <div className="card-body p-4 position-relative" style={{ zIndex: 2 }}>
              <h3 className="fw-bold mb-2 display-6">Chào mừng trở lại! 🚀</h3>
              <p className="opacity-75 mb-5 fs-5">Hôm nay bạn muốn ôn tập chủ đề gì?</p>
              
              <div className="d-flex gap-5 mt-auto">
                <div>
                  {/* Hiển thị số lượng học phần đã lọc */}
                  <h1 className="fw-bold mb-0 display-4">{realSetsCount}</h1>
                  <span className="fw-bold opacity-75 fs-5">Học phần</span>
                </div>
                <div>
                  <h1 className="fw-bold mb-0 display-4">{globalStats.total}</h1>
                  <span className="fw-bold opacity-75 fs-5">Từ vựng</span>
                </div>
              </div>
            </div>
            {/* Vòng tròn trang trí */}
            <div className="position-absolute" style={{ top: '-30%', right: '-10%', width: '350px', height: '350px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', zIndex: 1 }}></div>
            <div className="position-absolute" style={{ bottom: '-20%', right: '15%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.12)', borderRadius: '50%', zIndex: 1 }}></div>
          </div>
        </div>

        {/* Lối tắt (Shortcuts) */}
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-4 h-100">
            <Link to="/flashcards" className="card flex-grow-1 shadow-sm border-0 rounded-4 bg-white text-decoration-none text-dark transition-all hover-bg-light">
              <div className="card-body d-flex align-items-center justify-content-center gap-3">
                <span className="display-6">🗂️</span>
                <h4 className="fw-bold mb-0 text-primary">Flashcards</h4>
              </div>
            </Link>
            
            <Link to="/match" className="card flex-grow-1 shadow-sm border-0 rounded-4 bg-white text-decoration-none text-dark transition-all hover-bg-light">
              <div className="card-body d-flex align-items-center justify-content-center gap-3">
                <span className="display-6">🎮</span>
                <h4 className="fw-bold mb-0 text-success">Ghép thẻ</h4>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;