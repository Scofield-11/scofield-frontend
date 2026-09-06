import React, { useState, useEffect, useContext, useRef } from 'react';
import { VocabContext } from '../context/VocabContext';
import { toast } from 'react-toastify';
import LoadingSkeleton from './LoadingSkeleton';
import confetti from 'canvas-confetti';

function MatchMode() {
  const { sets, allVocabs, loading, fetchSets, fetchAllVocabs } = useContext(VocabContext);
  const [selectedSetId, setSelectedSetId] = useState('all');
  const [difficulty, setDifficulty] = useState(6); 
  const [gameMode, setGameMode] = useState('normal'); 
  const [pairType, setPairType] = useState('word_meaning'); // Đổi tên biến cho thống nhất
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastMatchTime, setLastMatchTime] = useState(null);
  const [highScore, setHighScore] = useState(null);
  const [bestTime, setBestTime] = useState(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => { fetchSets(); fetchAllVocabs(); }, [fetchSets, fetchAllVocabs]);

  useEffect(() => {
    setBestTime(localStorage.getItem(`matchBest_${selectedSetId}_${difficulty}_${pairType}`) || null);
    setHighScore(localStorage.getItem(`matchScore_${selectedSetId}_${pairType}`) || null);
  }, [selectedSetId, difficulty, pairType]);
  
  const [isStarted, setIsStarted] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [errorCards, setErrorCards] = useState([]); 
  const [isAnimating, setIsAnimating] = useState(false); 
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const vibrate = (pattern) => { if (navigator.vibrate) navigator.vibrate(pattern); };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  useEffect(() => {
    let interval;
    if (isStarted && !isFinished) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          if (gameMode === 'challenge') {
            if (prev <= 1) { setIsFinished(true); return 0; }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, isFinished, gameMode]);

  useEffect(() => {
    if (cards.length > 0 && matchedIds.length === cards.length / 2) {
      if (gameMode === 'challenge') generateCards(); 
      else {
        setIsFinished(true);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        vibrate([100, 50, 100, 50, 200]);
        const key = `matchBest_${selectedSetId}_${cards.length / 2}_${pairType}`;
        if (!bestTime || timeElapsed < bestTime) {
          localStorage.setItem(key, timeElapsed);
          setBestTime(timeElapsed);
          toast.success(`🎉 Kỷ lục mới: ${timeElapsed} giây!`);
        }
      }
    }
  }, [matchedIds, cards, gameMode, timeElapsed, bestTime, selectedSetId, pairType]);

  useEffect(() => {
    if (isFinished && gameMode === 'challenge') {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      vibrate([100, 50, 100, 50, 200]);
      if (!highScore || score > highScore) {
        localStorage.setItem(`matchScore_${selectedSetId}_${pairType}`, score);
        setHighScore(score);
        toast.success(`🏆 Điểm cao mới: ${score} điểm!`);
      }
    }
  }, [isFinished, gameMode, score, highScore, selectedSetId, pairType]);

  const getCardTexts = (vocab) => {
    if (pairType === 'word_meaning') return [vocab.word, vocab.meaning];
    if (pairType === 'word_furigana') return [vocab.word, vocab.furigana || vocab.word];
    if (pairType === 'furigana_meaning') return [vocab.furigana || vocab.word, vocab.meaning];
    return [vocab.word, vocab.meaning];
  };

  const generateCards = () => {
    let pool = [];
    if (selectedSetId === 'all') {
      const validSets = sets.filter(s => !s.title.startsWith('_Thư mục:'));
      pool = validSets.flatMap(s => s.vocabularies);
    } else {
      pool = sets.find(s => s.id === parseInt(selectedSetId))?.vocabularies || [];
    }

    const actualDifficulty = Math.min(difficulty, pool.length);
    const pivotIndex = Math.floor(Math.random() * pool.length);
    const pivotWord = pool[pivotIndex] || pool[0];
    
    const scoredPool = pool.map(v => {
      let sc = v.id === pivotWord.id ? 999 : 0;
      pivotWord.word.split('').forEach(c => { if (v.word.includes(c)) sc += 1; });
      return { ...v, score: sc + Math.random() };
    }).sort((a, b) => b.score - a.score);
    
    const initialCards = [];
    scoredPool.slice(0, actualDifficulty).forEach(vocab => {
      const [text1, text2] = getCardTexts(vocab);
      initialCards.push({ id: `cardA-${vocab.id}-${Date.now()}`, matchId: vocab.id, text: text1 });
      initialCards.push({ id: `cardB-${vocab.id}-${Date.now()}`, matchId: vocab.id, text: text2 });
    });
    setCards(initialCards.sort(() => 0.5 - Math.random()));
    setMatchedIds([]);
  };

  const startGame = () => {
    let pool = selectedSetId === 'all' ? allVocabs : (sets.find(s => s.id === parseInt(selectedSetId))?.vocabularies || []);
    if (pool.length < 2) return toast.warning(`Cần ít nhất 2 từ vựng để chơi!`);

    generateCards();
    setSelectedCards([]);
    setErrorCards([]);
    setIsAnimating(false);
    setTimeElapsed(gameMode === 'challenge' ? 60 : 0);
    setScore(0);
    setCombo(0);
    setLastMatchTime(null);
    setIsFinished(false);
    setIsStarted(true);
  };

  const handleCardClick = (card) => {
    if (isAnimating || matchedIds.includes(card.matchId) || selectedCards.length === 2 || selectedCards.find(c => c.id === card.id)) return;
    vibrate(20);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsAnimating(true); 
      if (newSelected[0].matchId === newSelected[1].matchId) {
        vibrate(50);
        const now = Date.now();
        let newCombo = 1;
        if (lastMatchTime && (now - lastMatchTime < 2500)) newCombo = combo + 1; 
        
        setCombo(newCombo);
        setScore(s => s + (10 * newCombo));
        setLastMatchTime(now);

        setTimeout(() => {
          setMatchedIds(prev => [...prev, newSelected[0].matchId]);
          setSelectedCards([]);
          setIsAnimating(false); 
        }, 300);
      } else {
        vibrate([100, 50, 100]);
        setCombo(0); 
        setErrorCards([newSelected[0].id, newSelected[1].id]);
        setTimeout(() => {
          setSelectedCards([]);
          setErrorCards([]);
          setIsAnimating(false); 
        }, 800);
      }
    }
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
      <div className="container mt-5 fade-in-slide" style={{ maxWidth: '500px' }}>
        <div className="card shadow-sm border-0 p-4 rounded-4">
          <h3 className="text-center mb-4 fw-bold">Game Ghép Thẻ</h3>
          <div className="mb-3">
            <label className="form-label fw-bold text-muted">Chế độ chơi:</label>
            <div className="d-flex gap-2">
              <button className={`btn w-50 fw-bold ${gameMode === 'normal' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setGameMode('normal')}>Thường</button>
              <button className={`btn w-50 fw-bold ${gameMode === 'challenge' ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => setGameMode('challenge')}>Thử thách 60s</button>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold text-muted">Chọn học phần:</label>
            <select className="form-select form-select-lg bg-light border-0 fw-bold text-dark" value={selectedSetId} onChange={(e) => setSelectedSetId(e.target.value)}>
              <option value="all">-- Tất cả từ vựng --</option>
              {Object.entries(groupedSets).map(([folder, folderSets]) => (
                <optgroup key={folder} label={folder}>
                  {folderSets.map(s => <option key={s.id} value={s.id}>{s.title} ({s.vocabularies.length} từ)</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold text-muted">Cặp thẻ muốn ghép:</label>
            <select className="form-select form-select-lg bg-light border-0 fw-bold text-primary" value={pairType} onChange={(e) => setPairType(e.target.value)}>
              <option value="word_meaning">Từ vựng (Kanji) ↔ Ý nghĩa</option>
              <option value="word_furigana">Từ vựng (Kanji) ↔ Phiên âm (Hiragana)</option>
              <option value="furigana_meaning">Phiên âm (Hiragana) ↔ Ý nghĩa</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold text-muted">Độ khó (Số cặp thẻ):</label>
            <input type="number" className="form-control bg-light border-0 fw-bold text-center text-dark" value={difficulty} min={2} onChange={(e) => setDifficulty(parseInt(e.target.value) || 2)} />
          </div>

          {gameMode === 'normal' && bestTime !== null && <div className="alert alert-info text-center fw-bold shadow-sm border-0 mb-4 rounded-3">🏆 Kỷ lục tốc độ: {bestTime} giây</div>}
          {gameMode === 'challenge' && highScore !== null && <div className="alert alert-warning text-center fw-bold shadow-sm border-0 mb-4 rounded-3">🏆 Điểm cao nhất: {highScore} điểm</div>}
          
          <button className={`btn btn-lg w-100 fw-bold shadow-sm ${gameMode === 'challenge' ? 'btn-danger' : 'btn-primary'}`} onClick={startGame}>Bắt đầu chơi</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`container-fluid py-4 text-center transition-all ${isFullscreen ? 'bg-light d-flex flex-column justify-content-center' : ''}`} ref={containerRef} style={isFullscreen ? { minHeight: '100vh', overflow: 'hidden' } : {}}>
      <div className="mx-auto" style={{ maxWidth: '900px', width: '100%' }}>
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button className="btn btn-light rounded-circle shadow-sm border-0" onClick={toggleFullscreen} title="Toàn màn hình">
            {isFullscreen ? '↙️' : '⛶'}
          </button>

          <h4 className="fw-bold m-0 text-center flex-grow-1">
            {gameMode === 'challenge' ? 'Còn lại: ' : 'Thời gian: '}
            <span className={gameMode === 'challenge' && timeElapsed <= 10 ? 'text-danger shake d-inline-block' : 'text-primary'}>{timeElapsed}s</span>
          </h4>
          
          <button className="btn btn-outline-secondary fw-bold shadow-sm" onClick={() => setIsStarted(false)}>Thoát</button>
        </div>

        {gameMode === 'challenge' && (
          <div className="mb-4 d-flex flex-column align-items-center gap-2 position-relative">
            <div className="d-flex align-items-center gap-3">
              <h4 className="fw-bold m-0 border px-4 py-2 rounded-pill bg-white shadow-sm">
                Điểm: <span className="text-success">{score}</span>
              </h4>
              {combo > 1 && (
                <div className="position-relative">
                  <span className="badge rounded-pill bg-danger fs-5 px-3 py-2 fade-in shadow-sm streak-glow">
                    Combo x{combo} 🔥
                  </span>
                  <div className="position-absolute top-100 start-50 translate-middle-x mt-2 w-100 overflow-hidden rounded-pill" style={{ height: '6px', backgroundColor: 'rgba(220,53,69,0.2)' }}>
                    <div key={combo} className="bg-danger h-100 combo-timer-bar rounded-pill"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isFinished ? (
          <div className="card shadow-lg border-0 p-5 mt-4 rounded-4 fade-in-slide mx-auto bg-white" style={{ maxWidth: '600px' }}>
            <h2 className="text-success fw-bold mb-3">🎉 Tuyệt vời!</h2>
            {gameMode === 'normal' ? (
              <p className="fs-5 text-muted mb-4">Bạn đã hoàn thành trong <strong className="text-dark">{timeElapsed} giây</strong>.</p>
            ) : (
              <p className="fs-5 text-muted mb-4">Tổng điểm của bạn: <strong className="text-danger fs-3">{score}</strong></p>
            )}
            <button className={`btn btn-lg mt-2 fw-bold w-100 shadow-sm ${gameMode === 'challenge' ? 'btn-danger' : 'btn-primary'}`} onClick={startGame}>Chơi lại</button>
          </div>
        ) : (
          <div className="row g-3 px-2">
            {cards.map(card => {
              const isSelected = selectedCards.some(c => c.id === card.id);
              const isMatched = matchedIds.includes(card.matchId);
              const isError = errorCards.includes(card.id);
              
              if (isMatched) {
                return (
                  <div className="col-6 col-md-4 col-lg-3" key={card.id}>
                    <div className="card h-100 border-0 bg-transparent" style={{ opacity: 0, cursor: 'default' }}><div className="card-body p-4"></div></div>
                  </div>
                );
              }

              let cardClasses = 'bg-white text-dark hover-bg-light';
              let cardStyles = { cursor: 'pointer', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid transparent' };
              if (isSelected) { cardClasses = 'bg-primary text-white'; cardStyles.border = '3px solid var(--bs-primary)'; }
              if (isError) { cardClasses = 'bg-danger text-white shake'; cardStyles.border = '3px solid #dc3545'; }

              return (
                <div className="col-6 col-md-4 col-lg-3" key={card.id}>
                  <div className={`card h-100 shadow-sm transition-all rounded-4 ${cardClasses}`} style={cardStyles} onClick={() => handleCardClick(card)}>
                    <div className="card-body d-flex align-items-center justify-content-center p-3 text-wrap" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{card.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchMode;