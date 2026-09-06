import React, { useState, useEffect, useContext, useRef } from 'react';
import { VocabContext } from '../context/VocabContext';
import { toast } from 'react-toastify';
import LoadingSkeleton from './LoadingSkeleton';
import confetti from 'canvas-confetti';
import api from '../api/axiosConfig';
import { playSound } from '../utils/audio'; // Import âm thanh

const CHUNK_SIZE = 4;

function LearnMode() {
  const { sets, allVocabs, loading, fetchSets, fetchAllVocabs } = useContext(VocabContext);
  const [selectedSetId, setSelectedSetId] = useState('all');

  useEffect(() => { fetchSets(); fetchAllVocabs(); }, [fetchSets, fetchAllVocabs]);

  const [isStarted, setIsStarted] = useState(false);
  const [pairType, setPairType] = useState('word_meaning');
  const [isReversed, setIsReversed] = useState(false); 
  
  const [rounds, setRounds] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRoundWords, setCurrentRoundWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [mode, setMode] = useState('choice'); 
  const [options, setOptions] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  const [isShaking, setIsShaking] = useState(false);
  const [onlyDue, setOnlyDue] = useState(false); 
  const [onlyStarred, setOnlyStarred] = useState(false); 

  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0); 
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const vibrate = (pattern) => { if (navigator.vibrate) navigator.vibrate(pattern); };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => toast.error("Không hỗ trợ Fullscreen"));
    else document.exitFullscreen();
  };

  const handleExit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setIsStarted(false);
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  const getSideLabel = (type, side) => {
    if (type === 'word_meaning') return side === 'front' ? 'Từ vựng (Gốc)' : 'Ý nghĩa';
    if (type === 'word_furigana') return side === 'front' ? 'Từ vựng (Gốc)' : 'Phiên âm';
    if (type === 'furigana_meaning') return side === 'front' ? 'Phiên âm' : 'Ý nghĩa';
  };

  const getFrontLabel = () => isReversed ? getSideLabel(pairType, 'back') : getSideLabel(pairType, 'front');
  const getBackLabel = () => isReversed ? getSideLabel(pairType, 'front') : getSideLabel(pairType, 'back');

  const getQuestionText = (vocab) => {
    if (!vocab) return "";
    if (pairType === 'word_meaning') return isReversed ? vocab.meaning : vocab.word;
    if (pairType === 'word_furigana') return isReversed ? (vocab.furigana || vocab.word) : vocab.word;
    if (pairType === 'furigana_meaning') return isReversed ? vocab.meaning : (vocab.furigana || vocab.word);
  };

  const getAnswerText = (vocab) => {
    if (!vocab) return "";
    if (pairType === 'word_meaning') return isReversed ? vocab.word : vocab.meaning;
    if (pairType === 'word_furigana') return isReversed ? vocab.word : (vocab.furigana || vocab.word);
    if (pairType === 'furigana_meaning') return isReversed ? (vocab.furigana || vocab.word) : vocab.meaning;
  };

  const updateSRS = async (vocabId, isCorrect) => {
    try { await api.put(`/vocabularies/${vocabId}/srs`, { is_correct: isCorrect }); } 
    catch (err) { console.error("Lỗi cập nhật SRS:", err); }
  };

  const playAudio = (text, type = 'normal') => {
    if (!text) return;
    const isVietnamese = text.split(" ").length > 0 && !/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text) && !/[a-zA-Z]/.test(text[0]);
    if (isVietnamese) return; 

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text) ? 'ja-JP' : 'en-US';
      utterance.rate = type === 'error' ? 0.8 : 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStart = () => {
    let pool = [];
    if (selectedSetId === 'all') {
      const validSets = sets.filter(s => !s.title.startsWith('_Thư mục:'));
      pool = validSets.flatMap(s => s.vocabularies);
    } else {
      const targetSet = sets.find(s => s.id === parseInt(selectedSetId));
      if (targetSet) pool = targetSet.vocabularies;
    }

    if (onlyDue) {
      const now = new Date();
      pool = pool.filter(v => v.next_review && new Date(v.next_review) <= now);
      if (pool.length === 0) return toast.success("Tuyệt vời! Không có từ vựng nào đến hạn.");
    }

    if (onlyStarred) {
      pool = pool.filter(v => v.is_starred);
      if (pool.length === 0) return toast.warning("Chưa có từ vựng được gắn sao!");
    }

    if (pool.length === 0) return toast.warning("Học phần này chưa có từ vựng phù hợp!");

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const chunked = [];
    for (let i = 0; i < shuffled.length; i += CHUNK_SIZE) chunked.push(shuffled.slice(i, i + CHUNK_SIZE));
    
    setRounds(chunked);
    setCurrentRoundIndex(0);
    setCurrentWordIndex(0);
    setMode('choice');
    setCurrentRoundWords([...chunked[0]]);
    generateOptions(chunked[0][0], allVocabs);
    setStreak(0);
    setMaxStreak(0);
    setIsStarted(true);
    setIsFinished(false);
  };

  const generateOptions = (currentWord, allData) => {
    if (!currentWord) return;
    const scoredAnswers = allData.filter(v => v.id !== currentWord.id).map(v => {
      let score = 0;
      currentWord.word.split('').forEach(c => { if (v.word.includes(c)) score += 1; });
      return { ...v, score: score + Math.random() * 0.5 };
    });
    scoredAnswers.sort((a, b) => b.score - a.score);
    const choices = [...scoredAnswers.slice(0, 3), currentWord].sort(() => 0.5 - Math.random());
    setOptions(choices);
  };

  const handleNextAfterFeedback = () => {
    setFeedback(null);
    setInputText('');

    if (currentWordIndex < currentRoundWords.length - 1) {
      const nextWord = currentRoundWords[currentWordIndex + 1];
      setCurrentWordIndex(currentWordIndex + 1);
      if (mode === 'choice') generateOptions(nextWord, allVocabs);
    } else {
      if (mode === 'choice') {
        setMode('typing');
        setCurrentWordIndex(0);
        setCurrentRoundWords([...rounds[currentRoundIndex]]);
      } else {
        if (currentRoundIndex < rounds.length - 1) {
          const nextRoundIdx = currentRoundIndex + 1;
          setCurrentRoundIndex(nextRoundIdx);
          setCurrentWordIndex(0);
          setMode('choice');
          setCurrentRoundWords([...rounds[nextRoundIdx]]);
          generateOptions(rounds[nextRoundIdx][0], allVocabs);
        } else {
          setIsFinished(true);
          playSound('win'); // Tiếng hoàn thành
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
          vibrate([100, 50, 100, 50, 200]); 
        }
      }
    }
  };

  const handleWrongAnswer = (currentWord, correctAnswerText, userAnsText) => {
    playSound('wrong'); // Tiếng buzzer sai
    vibrate([200, 100, 200]); 
    setStreak(0);
    updateSRS(currentWord.id, false);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
    setCurrentRoundWords(prev => [...prev, currentWord]); 
    setFeedback({ isCorrect: false, correctAnswer: correctAnswerText, yourAnswer: userAnsText });
    playAudio(correctAnswerText, 'error');
  };

  const handleCorrectAnswer = (currentWord) => {
    playSound('correct'); // Tiếng ting đúng
    vibrate(40);
    const newStreak = streak + 1;
    setStreak(newStreak);
    if (newStreak > maxStreak) setMaxStreak(newStreak);
    updateSRS(currentWord.id, true);
    handleNextAfterFeedback();
  };

  const handleChoiceSubmit = (selectedOption) => {
    const currentWord = currentRoundWords[currentWordIndex];
    if (selectedOption.id === currentWord.id) {
      handleCorrectAnswer(currentWord);
    } else {
      const correctAnsStr = getAnswerText(currentWord);
      const userAnsStr = getAnswerText(selectedOption);
      handleWrongAnswer(currentWord, correctAnsStr, userAnsStr);
    }
  };

  const checkFuzzyMatch = (input, correctStr) => {
    if(!correctStr) return false;
    const clean = (str) => str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ").trim().toLowerCase();
    return correctStr.split(',').map(s => clean(s)).includes(clean(input));
  };

  const handleTypeSubmit = (e) => {
    e.preventDefault();
    const currentWord = currentRoundWords[currentWordIndex];
    const correctAnsStr = getAnswerText(currentWord);
    
    if (checkFuzzyMatch(inputText, correctAnsStr)) {
      handleCorrectAnswer(currentWord);
    } else {
      handleWrongAnswer(currentWord, correctAnsStr, inputText.trim() || "(Để trống)");
    }
  };

  const handleDontKnow = () => {
    const currentWord = currentRoundWords[currentWordIndex];
    handleWrongAnswer(currentWord, getAnswerText(currentWord), "Không biết 🤷‍♂️");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isStarted && !isFinished && !feedback && mode === 'choice') {
        const key = parseInt(e.key);
        if (key >= 1 && key <= options.length) {
          handleChoiceSubmit(options[key - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isFinished, feedback, mode, options, currentRoundWords, currentWordIndex]);

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
      <div className="container mt-5 fade-in-slide" style={{ maxWidth: '650px' }}>
        <div className="card shadow-sm border-0 p-4 p-md-5 rounded-4 bg-white" style={{ borderRadius: '24px' }}>
          <h3 className="text-center mb-5 fw-bold text-dark">Cài đặt Chế độ Học</h3>
          
          <div className="mb-4">
            <label className="form-label fw-bold text-muted mb-2">1. Chọn học phần muốn học:</label>
            <select className="form-select form-select-lg bg-light border-0 fw-bold text-dark shadow-sm" style={{ borderRadius: '12px', height: '56px' }} value={selectedSetId} onChange={(e) => setSelectedSetId(e.target.value)}>
              <option value="all">-- Tất cả từ vựng --</option>
              {Object.entries(groupedSets).map(([folder, folderSets]) => (
                <optgroup key={folder} label={folder}>
                  {folderSets.map(s => <option key={s.id} value={s.id}>{s.title} ({s.vocabularies.length} từ)</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold text-muted mb-3">2. Nội dung vắt óc:</label>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div 
                  className={`card h-100 border-2 shadow-sm transition-all rounded-4 ${pairType === 'word_meaning' ? 'border-primary bg-primary text-white' : 'border-light bg-white text-dark hover-bg-light'}`}
                  style={{cursor: 'pointer'}}
                  onClick={() => { setPairType('word_meaning'); setIsReversed(false); }}
                >
                  <div className="card-body p-3 p-md-4 text-center">
                    <div className="display-6 mb-2">📖</div>
                    <h6 className="fw-bold mb-1">Dịch nghĩa</h6>
                    <small className={pairType === 'word_meaning' ? 'text-white-50' : 'text-muted'} style={{fontSize: '0.8rem'}}>Từ vựng ↔ Ý nghĩa</small>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-4">
                <div 
                  className={`card h-100 border-2 shadow-sm transition-all rounded-4 ${pairType === 'word_furigana' ? 'border-primary bg-primary text-white' : 'border-light bg-white text-dark hover-bg-light'}`}
                  style={{cursor: 'pointer'}}
                  onClick={() => { setPairType('word_furigana'); setIsReversed(false); }}
                >
                  <div className="card-body p-3 p-md-4 text-center">
                    <div className="display-6 mb-2">🔤</div>
                    <h6 className="fw-bold mb-1">Đọc Kanji</h6>
                    <small className={pairType === 'word_furigana' ? 'text-white-50' : 'text-muted'} style={{fontSize: '0.8rem'}}>Từ vựng ↔ Phiên âm</small>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-4">
                <div 
                  className={`card h-100 border-2 shadow-sm transition-all rounded-4 ${pairType === 'furigana_meaning' ? 'border-primary bg-primary text-white' : 'border-light bg-white text-dark hover-bg-light'}`}
                  style={{cursor: 'pointer'}}
                  onClick={() => { setPairType('furigana_meaning'); setIsReversed(false); }}
                >
                  <div className="card-body p-3 p-md-4 text-center">
                    <div className="display-6 mb-2">🗣️</div>
                    <h6 className="fw-bold mb-1">Nghe Nói</h6>
                    <small className={pairType === 'furigana_meaning' ? 'text-white-50' : 'text-muted'} style={{fontSize: '0.8rem'}}>Phiên âm ↔ Ý nghĩa</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 text-start">
            <div className="form-check form-switch fs-6 d-flex align-items-center gap-3 bg-light p-3 rounded-4 border-0 shadow-sm">
              <input className="form-check-input m-0 shadow-sm" type="checkbox" id="srsToggle" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label className="form-check-label fw-bold text-dark m-0" htmlFor="srsToggle" style={{ cursor: 'pointer' }}>Chỉ ôn tập từ đến hạn (Cơ chế Spaced Repetition)</label>
            </div>
            <div className="form-check form-switch fs-6 d-flex align-items-center gap-3 bg-light p-3 rounded-4 border-0 shadow-sm mt-3">
              <input className="form-check-input m-0 shadow-sm" type="checkbox" id="starredLearnToggle" checked={onlyStarred} onChange={(e) => setOnlyStarred(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label className="form-check-label fw-bold text-dark m-0" htmlFor="starredLearnToggle" style={{ cursor: 'pointer' }}>Chỉ học từ đã đánh dấu (⭐)</label>
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

          <button className="btn btn-primary btn-lg w-100 fw-bold shadow-lg" style={{ borderRadius: '14px', padding: '15px', backgroundColor: '#8a2be2', border: 'none' }} onClick={handleStart}>
            Bắt đầu vắt óc 🧠
          </button>
        </div>
      </div>
    );
  }

  const currentWord = currentRoundWords[currentWordIndex];
  const questionText = getQuestionText(currentWord);
  const progressPercent = Math.round(((currentRoundIndex + (currentWordIndex/currentRoundWords.length)) / rounds.length) * 100);

  return (
    <div className={`container-fluid py-4 transition-all ${isFullscreen ? 'bg-light d-flex flex-column justify-content-center' : ''}`} ref={containerRef} style={isFullscreen ? { minHeight: '100vh', overflow: 'hidden' } : {}}>
      <div className="mx-auto" style={{ maxWidth: '650px', width: '100%' }}>
        
        {!isFinished && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button className="btn btn-light rounded-circle shadow-sm border-0 d-print-none hover-bg-light transition-all" onClick={toggleFullscreen} title="Toàn màn hình (F)">
                {isFullscreen ? '↙️' : '⛶'}
              </button>
              <div className="d-flex align-items-center gap-3 fw-bold text-muted">
                {streak > 0 && (
                  <div className="streak-indicator d-flex align-items-center bg-white rounded-pill shadow-sm border overflow-hidden fade-in" style={{ height: '38px', borderColor: streak >= 5 ? '#dc3545' : '#ffc107' }}>
                    <div className={`px-3 h-100 d-flex align-items-center fw-bold fs-6 text-white ${streak >= 5 ? 'bg-danger streak-glow' : 'bg-warning text-dark'}`}>
                      🔥 {streak}
                    </div>
                    <div className="d-flex align-items-center gap-1 px-2" style={{ width: '70px' }}>
                      {[...Array(5)].map((_, i) => {
                        const isActive = i < (streak > 0 ? ((streak - 1) % 5) + 1 : 0);
                        return (
                          <div 
                            key={i} 
                            className={`rounded-pill ${isActive ? (streak >= 5 ? 'bg-danger' : 'bg-warning') : 'bg-light'}`} 
                            style={{ height: '6px', flexGrow: 1, transition: 'all 0.3s ease', transform: isActive ? 'scaleY(1.5)' : 'scaleY(1)' }}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <span className="fs-5">{progressPercent}%</span>
              </div>
            </div>
            <div className="progress mb-4 shadow-sm" style={{ height: '10px', borderRadius: '10px' }}>
              <div className="progress-bar" role="progressbar" style={{ width: `${progressPercent}%`, transition: 'width 0.4s ease', backgroundColor: '#8a2be2' }}></div>
            </div>
          </>
        )}
        
        {isFinished ? (
          <div className="card shadow-lg border-0 p-5 rounded-4 fade-in-slide mx-auto bg-white">
            <div className="display-1 mb-3 text-center">🏆</div>
            <h2 className="fw-bold text-success mb-3 text-center">Bài học hoàn tất!</h2>
            <p className="fs-5 text-muted mb-4 text-center">Bạn vừa hoàn thành một phiên vắt óc rất chất lượng.</p>
            
            <div className="row g-3 mb-5">
              <div className="col-6">
                <div className="bg-light p-4 rounded-4 h-100 border border-warning text-center" style={{ borderWidth: '2px !important' }}>
                  <h2 className="fw-bold text-warning mb-0">🔥 {maxStreak}</h2>
                  <span className="fw-bold text-muted small">CHUỖI DÀI NHẤT</span>
                </div>
              </div>
              <div className="col-6">
                <div className="bg-light p-4 rounded-4 h-100 border text-center" style={{ borderColor: '#8a2be2', borderWidth: '2px !important' }}>
                  <h2 className="fw-bold mb-0" style={{ color: '#8a2be2' }}>⚡ {rounds.flat().length * 10}</h2>
                  <span className="fw-bold text-muted small">ĐIỂM KINH NGHIỆM</span>
                </div>
              </div>
            </div>
            <button className="btn btn-lg fw-bold w-100 shadow-sm text-white hover-scale" style={{ backgroundColor: '#8a2be2' }} onClick={handleExit}>Hoàn thành & Quay lại</button>
          </div>
        ) : (
          <div className={`card shadow-sm border-0 rounded-4 fade-in-slide ${isShaking ? 'shake border border-danger' : ''}`} key={`${currentRoundIndex}-${currentWordIndex}-${mode}-${feedback ? 'fb' : 'q'}`}>
            <div className="card-body p-4 p-md-5">
              {feedback ? (
                <div className="text-center">
                  <h5 className="text-danger fw-bold mb-4">❌ Chưa chính xác! Từ này sẽ được hỏi lại.</h5>
                  <div className="p-4 mb-4 bg-light rounded-4 text-start border-start border-danger border-4 shadow-sm">
                    <p className="mb-2"><strong>Câu hỏi:</strong> <span className="fs-5" style={{ color: '#8a2be2' }}>{questionText}</span></p>
                    <p className="text-muted mb-3"><strong>Bạn chọn/gõ:</strong> <span className="text-decoration-line-through">{feedback.yourAnswer}</span></p>
                    <p className="text-success fs-4 mb-0 fw-bold d-flex align-items-center">
                      ✓ {feedback.correctAnswer}
                      <button className="btn btn-sm btn-light rounded-circle ms-3 shadow-sm border transition-all hover-bg-light" onClick={() => playAudio(feedback.correctAnswer)} title="Nghe lại">🔊</button>
                    </p>
                  </div>
                  <button className="btn btn-primary btn-lg fw-bold w-100 mt-2 shadow-sm text-white hover-scale" style={{ backgroundColor: '#8a2be2' }} onClick={handleNextAfterFeedback} autoFocus>Đã hiểu, tiếp tục</button>
                </div>
              ) : (
                <div className="text-center">
                  <span className="badge bg-light text-muted border mb-3 fw-bold px-3 py-2 fs-6 shadow-sm">
                    {mode === 'choice' ? 'Chọn đáp án đúng' : 'Gõ đáp án chính xác'}
                  </span>
                  
                  <div className="d-flex justify-content-center align-items-center gap-3 mb-4">
                    <h3 className="text-dark fw-bold m-0" style={{ fontSize: '2.5rem' }}>{questionText}</h3>
                    <button className="btn btn-light rounded-circle shadow-sm transition-all hover-bg-light" onClick={() => playAudio(questionText)} title="Phát âm">🔊</button>
                  </div>
                  
                  {mode === 'choice' ? (
                    <div className="d-flex flex-column gap-3 mt-4">
                      {options.map((opt, i) => (
                        <button 
                          key={opt.id} 
                          className="btn btn-light border py-3 text-start px-4 fs-5 fw-bold hover-bg-light transition-all d-flex align-items-center shadow-sm" 
                          style={{ borderRadius: '12px' }}
                          onClick={() => handleChoiceSubmit(opt)}
                        >
                          <span className="badge bg-secondary me-3" style={{ opacity: 0.6 }}>{i + 1}</span>
                          {getAnswerText(opt)}
                        </button>
                      ))}
                      <div className="mt-3 text-end">
                        <button className="btn btn-link text-muted fw-bold text-decoration-none border-0 hover-scale" onClick={handleDontKnow}>Tôi không biết câu này 🤷‍♂️</button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleTypeSubmit} className="mt-4">
                      <div className="position-relative mb-4">
                        <input 
                          type="text" 
                          className="form-control form-control-lg text-center py-4 bg-light fw-bold shadow-sm" 
                          placeholder={`Nhập ${getBackLabel().toLowerCase()} vào đây...`}
                          value={inputText} onChange={(e) => setInputText(e.target.value)} autoComplete="off" autoFocus
                          style={{ fontSize: '1.5rem', borderRadius: '16px', border: '2px solid #dee2e6' }}
                        />
                      </div>
                      <div className="d-flex gap-3">
                        <button type="button" className="btn btn-outline-secondary w-50 py-3 fs-5 fw-bold border hover-bg-light shadow-sm rounded-4" onClick={handleDontKnow}>Bỏ qua</button>
                        <button type="submit" className="btn w-50 py-3 fs-5 fw-bold shadow-sm rounded-4 text-white hover-scale" style={{ backgroundColor: '#8a2be2' }}>Kiểm tra</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LearnMode;