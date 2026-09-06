import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Flashcard from './Flashcard';
import SaveNoteModal from './SaveNoteModal';
import { VocabContext } from '../context/VocabContext';
import { toast } from 'react-toastify';
import LoadingSkeleton from './LoadingSkeleton';
import confetti from 'canvas-confetti';
import api from '../api/axiosConfig';
import { playSound } from '../utils/audio'; // Import âm thanh

function FlashcardMode() {
  const { sets, loading, fetchSets } = useContext(VocabContext);
  const [selectedSetId, setSelectedSetId] = useState('all');

  useEffect(() => { fetchSets(); }, [fetchSets]);
  
  const [vocabsToStudy, setVocabsToStudy] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [editingVocab, setEditingVocab] = useState(null);
  const [noteModalVocab, setNoteModalVocab] = useState(null); 

  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem("flashcardAutoPlay") === "true");
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [showFuriganaHint, setShowFuriganaHint] = useState(true);
  const [frontSide, setFrontSide] = useState('word');
  const [backSide, setBackSide] = useState('meaning');
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // States dành cho tính năng Vuốt trên Mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => { localStorage.setItem("flashcardAutoPlay", autoPlay); }, [autoPlay]);

  const vibrate = (ms = 40) => { if (navigator.vibrate) navigator.vibrate(ms); };

  const handleStart = () => {
    let pool = [];
    if (selectedSetId === 'all') {
      const validSets = sets.filter(s => !s.title.startsWith('_Thư mục:'));
      pool = validSets.flatMap(s => s.vocabularies);
    } else {
      const targetSet = sets.find(s => s.id === parseInt(selectedSetId));
      if (targetSet) pool = targetSet.vocabularies;
    }

    if (pool.length === 0) return toast.warning("Học phần này chưa có từ vựng!");

    setVocabsToStudy(pool);
    setCurrentIndex(0);
    setIsStarted(true);
    setIsFinished(false);
    setIsSlideshow(false); 
  };

  const handleNext = useCallback(() => {
    vibrate();
    playSound('pop'); // Tiếng pop khi chuyển thẻ
    if (currentIndex < vocabsToStudy.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      setIsSlideshow(false); 
      playSound('win'); // Tiếng hoàn thành
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  }, [currentIndex, vocabsToStudy.length]);

  const handlePrev = useCallback(() => {
    vibrate();
    playSound('pop');
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  }, [currentIndex]);

  const handleShuffle = () => {
    vibrate(60);
    const shuffled = [...vocabsToStudy].sort(() => 0.5 - Math.random());
    setVocabsToStudy(shuffled);
    setCurrentIndex(0); 
    setIsFinished(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => toast.error("Trình duyệt không hỗ trợ Fullscreen"));
    } else {
      document.exitFullscreen();
    }
  };

  // Logic Vuốt ngón tay
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);
    
    // Yêu cầu vuốt ngang hơn 50px và lớn hơn độ lệch dọc
    if (Math.abs(distanceX) > 50 && Math.abs(distanceX) > distanceY) {
      if (distanceX > 0) handleNext(); // Vuốt sang trái
      else handlePrev(); // Vuốt sang phải
    }
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  useEffect(() => {
    if (!isStarted || isFinished || editingVocab || noteModalVocab) return;
    const handleKeyDown = (e) => {
      if (e.code === 'Space') { e.preventDefault(); document.querySelector('.flashcard-container')?.click(); } 
      else if (e.code === 'ArrowRight') handleNext();
      else if (e.code === 'ArrowLeft') handlePrev();
      else if (e.code === 'KeyF') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isFinished, editingVocab, noteModalVocab, handleNext, handlePrev]);

  useEffect(() => {
    let flipTimer, nextTimer;
    if (isSlideshow && !isFinished && isStarted && !editingVocab && !noteModalVocab) {
      flipTimer = setTimeout(() => document.querySelector('.flashcard-container')?.click(), 2500); 
      nextTimer = setTimeout(() => handleNext(), 5000); 
    }
    return () => { clearTimeout(flipTimer); clearTimeout(nextTimer); };
  }, [currentIndex, isSlideshow, isFinished, isStarted, editingVocab, noteModalVocab, handleNext]);

  const handleQuickSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/vocabularies/${editingVocab.id}`, editingVocab);
      setVocabsToStudy(prev => {
        const newArr = [...prev];
        newArr[currentIndex] = editingVocab;
        return newArr;
      });
      toast.success("Đã lưu chỉnh sửa!");
      setEditingVocab(null);
    } catch (err) { toast.error("Lỗi khi lưu!"); }
  };

  if (loading) return <LoadingSkeleton />;

  if (!isStarted) {
    const validSets = sets.filter(s => !s.title.startsWith('_Thư mục:'));
    const groupedSets = validSets.reduce((acc, set) => {
      const folder = set.folder_path || '🏠 Thư mục gốc';
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(set);
      return acc;
    }, {});

    return (
      <div className="container mt-5 fade-in-slide" style={{ maxWidth: '600px' }}>
        <div className="card shadow-sm border-0 p-4 p-md-5 rounded-4 bg-white" style={{ borderRadius: '24px' }}>
          <h3 className="text-center mb-5 fw-bold text-dark" style={{ opacity: 0.8 }}>Thiết lập Flashcards</h3>
          
          <div className="mb-4">
            <label className="form-label fw-bold text-muted mb-2">Chọn học phần muốn ôn:</label>
            <select className="form-select form-select-lg bg-light border-0 fw-bold text-dark shadow-sm" style={{ borderRadius: '12px', height: '56px' }} value={selectedSetId} onChange={(e) => setSelectedSetId(e.target.value)}>
              <option value="all">-- Tất cả từ vựng --</option>
              {Object.entries(groupedSets).map(([folder, folderSets]) => (
                <optgroup key={folder} label={folder}>
                  {folderSets.map(s => <option key={s.id} value={s.id}>{s.title} ({s.vocabularies.length} từ)</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-6">
              <label className="form-label fw-bold text-muted small">MẶT TRƯỚC HIỂN THỊ:</label>
              <select className="form-select bg-light border-0 fw-bold text-primary shadow-sm" style={{ borderRadius: '12px' }} value={frontSide} onChange={(e) => setFrontSide(e.target.value)}>
                <option value="word">Từ vựng (Kanji/Gốc)</option>
                <option value="furigana">Phiên âm (Hiragana/IPA)</option>
                <option value="meaning">Ý nghĩa (Tiếng Việt)</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label fw-bold text-muted small">MẶT SAU HIỂN THỊ:</label>
              <select className="form-select bg-light border-0 fw-bold text-primary shadow-sm" style={{ borderRadius: '12px' }} value={backSide} onChange={(e) => setBackSide(e.target.value)}>
                <option value="meaning">Ý nghĩa (Tiếng Việt)</option>
                <option value="furigana">Phiên âm (Hiragana/IPA)</option>
                <option value="word">Từ vựng (Kanji/Gốc)</option>
              </select>
            </div>
          </div>

          <div className="mb-5 d-flex flex-column gap-3">
            <div className="form-check form-switch fs-6 d-flex align-items-center gap-3 bg-light p-3 rounded-4 border-0 shadow-sm">
              <input className="form-check-input m-0 shadow-sm" type="checkbox" id="furiganaToggle" checked={showFuriganaHint} onChange={(e) => setShowFuriganaHint(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label className="form-check-label fw-bold text-dark m-0" htmlFor="furiganaToggle" style={{ cursor: 'pointer' }}>Hiển thị phiên âm nhỏ (Hint) trên mặt thẻ Từ vựng</label>
            </div>
          </div>

          <button 
            className="btn btn-lg w-100 fw-bold shadow-lg text-white hover-scale" 
            style={{ borderRadius: '14px', padding: '16px', backgroundColor: '#8a2be2', border: 'none' }} 
            onClick={handleStart}
          >
            Bắt đầu lật thẻ
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="container mt-5 text-center fade-in-slide">
        <div className="card shadow-lg border-0 p-5 rounded-4 mx-auto text-white position-relative overflow-hidden" style={{ maxWidth: '500px', backgroundColor: '#8a2be2' }}>
          <div className="position-relative" style={{ zIndex: 2 }}>
            <div className="display-1 mb-3">🎓</div>
            <h2 className="fw-bold mb-3">Chúc mừng!</h2>
            <p className="fs-5 opacity-75 mb-4">Bạn đã ôn tập xong <strong>{vocabsToStudy.length}</strong> thẻ từ vựng.</p>
            <div className="d-flex flex-column gap-3">
              <button className="btn btn-warning py-3 fw-bold text-dark fs-5 shadow-sm rounded-4 hover-scale" onClick={handleShuffle}>🔀 Trộn & Học lại</button>
              <button className="btn btn-light py-3 fw-bold fs-5 text-primary shadow-sm rounded-4 hover-scale" onClick={() => setIsStarted(false)}>Học phần khác</button>
            </div>
          </div>
          <div className="position-absolute bg-white opacity-10 rounded-circle" style={{ width: '200px', height: '200px', top: '-50px', right: '-50px' }}></div>
          <div className="position-absolute bg-white opacity-10 rounded-circle" style={{ width: '150px', height: '150px', bottom: '-20px', left: '-50px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container-fluid py-4 text-center transition-all ${isFullscreen ? 'bg-light d-flex flex-column justify-content-center align-items-center' : ''}`} ref={containerRef} style={isFullscreen ? { height: '100vh', overflow: 'hidden' } : {}}>
      
      {editingVocab && (
        <div className="modal d-flex align-items-center justify-content-center fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="card border-0 shadow-lg rounded-4 p-4" style={{ width: '90%', maxWidth: '400px' }}>
            <h5 className="fw-bold mb-4" style={{ color: '#8a2be2' }}>✏️ Sửa nhanh thẻ</h5>
            <form onSubmit={handleQuickSave}>
              <input type="text" className="form-control bg-light border-0 mb-3 fw-bold shadow-sm" value={editingVocab.word} onChange={e => setEditingVocab({...editingVocab, word: e.target.value})} placeholder="Từ vựng/Kanji" required />
              <input type="text" className="form-control bg-light border-0 mb-3 shadow-sm" value={editingVocab.furigana || ''} onChange={e => setEditingVocab({...editingVocab, furigana: e.target.value})} placeholder="Phiên âm/Hiragana" />
              <input type="text" className="form-control bg-light border-0 mb-4 shadow-sm" value={editingVocab.meaning} onChange={e => setEditingVocab({...editingVocab, meaning: e.target.value})} placeholder="Ý nghĩa" required />
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary w-50 fw-bold rounded-3" onClick={() => setEditingVocab(null)}>Hủy</button>
                <button type="submit" className="btn w-50 fw-bold text-white rounded-3" style={{ backgroundColor: '#8a2be2' }}>Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {noteModalVocab && (
        <SaveNoteModal vocab={noteModalVocab} sets={sets} onClose={() => setNoteModalVocab(null)} onSaveSuccess={() => fetchSets(false, true)} />
      )}

      <div className="d-flex justify-content-between align-items-center mx-auto mb-3" style={{ maxWidth: '450px' }}>
        <h3 className="m-0 fw-bold">Flashcards</h3>
        <button className="btn btn-light rounded-circle shadow-sm border-0 hover-scale" onClick={toggleFullscreen} title="Bật/Tắt Toàn màn hình (Phím F)">
          {isFullscreen ? '↙️' : '⛶'}
        </button>
      </div>
      
      <div className="mb-2 text-muted fw-bold d-flex justify-content-between align-items-center mx-auto" style={{ maxWidth: '450px' }}>
        <span>Thẻ {currentIndex + 1} / {vocabsToStudy.length}</span>
        <span>{Math.round(((currentIndex + 1) / vocabsToStudy.length) * 100)}%</span>
      </div>
      <div className="progress mb-4 mx-auto shadow-sm" style={{ height: '8px', maxWidth: '450px', borderRadius: '10px' }}>
        <div className="progress-bar" role="progressbar" style={{ width: `${((currentIndex + 1) / vocabsToStudy.length) * 100}%`, backgroundColor: '#8a2be2' }}></div>
      </div>

      <div 
        className="d-flex justify-content-center fade-in-slide" 
        key={currentIndex}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndEvent}
      >
        <Flashcard 
          vocab={vocabsToStudy[currentIndex]} 
          autoPlay={autoPlay} 
          frontSide={frontSide}
          backSide={backSide}
          showFuriganaHint={showFuriganaHint}
          onEdit={setEditingVocab}
          onSaveNote={setNoteModalVocab} 
        />
      </div>
      
      <div className="d-flex flex-wrap justify-content-center gap-4 mx-auto mt-4" style={{ maxWidth: '600px' }}>
        <div className="form-check form-switch bg-white px-4 py-2 rounded-pill shadow-sm border d-flex align-items-center gap-2">
          <input className="form-check-input m-0 shadow-sm" type="checkbox" id="autoPlaySwitch" checked={autoPlay} onChange={() => setAutoPlay(!autoPlay)} style={{ cursor: 'pointer' }} />
          <label className="form-check-label text-muted fw-bold m-0" htmlFor="autoPlaySwitch" style={{ cursor: 'pointer' }}>Tự động phát âm</label>
        </div>
        <div className="form-check form-switch bg-white px-4 py-2 rounded-pill shadow-sm border d-flex align-items-center gap-2">
          <input className="form-check-input m-0 shadow-sm" type="checkbox" id="slideshowSwitch" checked={isSlideshow} onChange={() => setIsSlideshow(!isSlideshow)} style={{ cursor: 'pointer' }} />
          <label className="form-check-label text-muted fw-bold m-0" htmlFor="slideshowSwitch" style={{ cursor: 'pointer' }}>Trình chiếu chậm</label>
        </div>
      </div>

      <div className="mt-4 d-flex justify-content-center gap-3">
        <button className="btn btn-outline-secondary px-4 py-2 fw-bold rounded-pill hover-scale" onClick={handlePrev} disabled={currentIndex === 0}>← Trước</button>
        <button className="btn btn-warning px-4 py-2 fw-bold text-dark shadow-sm rounded-pill hover-scale" onClick={handleShuffle}>🔀 Trộn thẻ</button>
        <button className="btn px-4 py-2 fw-bold text-white shadow-sm rounded-pill hover-scale" style={{ backgroundColor: '#8a2be2' }} onClick={handleNext}>Tiếp →</button>
      </div>
      
      {!isFullscreen && (
        <p className="text-muted small mb-0 mt-4 d-none d-md-block">
          💡 <strong>Mẹo:</strong> Phím <strong>Space</strong> lật thẻ, <strong>Trái/Phải</strong> (Vuốt ngang) để chuyển từ, <strong>F</strong> toàn màn hình.
        </p>
      )}

      {!isFullscreen && (
        <div className="mt-4">
           <button className="btn btn-link text-muted text-decoration-none fw-bold hover-bg-light rounded-pill px-3 py-2" onClick={() => setIsStarted(false)}>
              &larr; Cài đặt lại / Đổi học phần
           </button>
        </div>
      )}
    </div>
  );
}

export default FlashcardMode;