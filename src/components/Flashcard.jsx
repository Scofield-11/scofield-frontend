import { useState, useEffect } from "react";
import { playSound } from '../utils/audio'; // Import bộ máy âm thanh

function Flashcard({ vocab, autoPlay, contentType = 'vocab', isReversed = false, onEdit, onSaveNote }) {
  const [flipped, setFlipped] = useState(false);

  const handleOpenNote = (e) => {
    e.stopPropagation();
    if (onSaveNote && vocab) onSaveNote(vocab);
  };

  // Bảo vệ trường hợp vocab bị rỗng khi component render sớm
  if (!vocab) return null;

  const detectLanguage = (text, type) => {
    if (type === 'meaning') return 'vi-VN';
    if (!text) return 'en-US';
    const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
    return hasJapanese ? 'ja-JP' : 'en-US';
  };

  const originalText = contentType === 'kanji' ? (vocab.kanji || '') : (vocab.word || '');
  const meaningText = vocab.meaning || '';

  const frontText = isReversed ? meaningText : originalText;
  const backText = isReversed ? originalText : meaningText;
  
  const frontLang = detectLanguage(frontText, isReversed ? 'meaning' : 'original');
  const backLang = detectLanguage(backText, isReversed ? 'original' : 'meaning');

  const renderOriginalSide = () => {
    if (contentType === 'kanji') {
      return (
        <>
          <div className="text-muted fw-bold mb-1" style={{ fontSize: '1.2rem' }}>{vocab.hiragana}</div>
          <div style={{ fontSize: '3.5rem', fontFamily: '"Yu Mincho", "MS Mincho", serif', lineHeight: '1.2' }}>{vocab.kanji}</div>
          <div className="text-primary mt-2 fw-bold" style={{ fontSize: '1.1rem', letterSpacing: '2px' }}>{vocab.hanviet}</div>
        </>
      );
    }
    return <span>{vocab.word}</span>;
  };

  const renderMeaningSide = () => {
    return <span>{vocab.meaning}</span>;
  };

  const speak = (text, lang) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    setFlipped(false);
    if (autoPlay) setTimeout(() => speak(frontText, frontLang), 250);
  }, [vocab, autoPlay, contentType, isReversed]);

  const handleFlip = () => {
    playSound('pop'); // <--- Âm thanh lật thẻ
    const newState = !flipped;
    setFlipped(newState);
    if (autoPlay) speak(newState ? backText : frontText, newState ? backLang : frontLang);
  };

  const playAudio = (e, text, lang) => {
    e.stopPropagation(); 
    speak(text, lang);
  };

  return (
    <div className="flashcard-container" onClick={handleFlip}>
      <div className={`flashcard-inner ${flipped ? "flipped" : ""}`}>
        <div className="flashcard-front flex-column">
          <button 
            className="btn btn-light position-absolute top-0 start-0 m-3 rounded-circle shadow-sm border-0 fs-5 d-flex align-items-center justify-content-center transition-all hover-scale"
            style={{ width: '40px', height: '40px', zIndex: 10, color: '#8a2be2' }}
            onClick={handleOpenNote}
            title="Lưu từ này vào sổ tay (Note)"
          >📓</button>
          
          {isReversed ? renderMeaningSide() : renderOriginalSide()}
          
          <button 
            className="btn btn-light position-absolute top-0 end-0 m-3 rounded-circle shadow-sm transition-all hover-bg-light hover-scale"
            style={{ width: '40px', height: '40px', zIndex: 10 }}
            onClick={(e) => playAudio(e, frontText, frontLang)}
            title="Nghe phát âm"
          >🔊</button>
        </div>

        <div className="flashcard-back flex-column">
          <button 
            className="btn btn-light position-absolute top-0 start-0 m-3 rounded-circle shadow-sm border-0 fs-5 d-flex align-items-center justify-content-center transition-all hover-scale"
            style={{ width: '40px', height: '40px', zIndex: 10, color: '#8a2be2' }}
            onClick={handleOpenNote}
          >📓</button>
          <button 
            className="btn btn-light position-absolute bottom-0 start-0 m-3 rounded-circle shadow-sm border-0 fs-5 d-flex align-items-center justify-content-center transition-all hover-scale"
            style={{ width: '40px', height: '40px', zIndex: 10 }}
            onClick={(e) => { e.stopPropagation(); if(onEdit) onEdit(vocab); }}
            title="Sửa nhanh từ này"
          >✏️</button>
          
          {isReversed ? renderOriginalSide() : renderMeaningSide()}
          
          <button 
            className="btn btn-light position-absolute top-0 end-0 m-3 rounded-circle shadow-sm transition-all hover-scale"
            style={{ width: '40px', height: '40px', zIndex: 10 }}
            onClick={(e) => playAudio(e, backText, backLang)}
          >🔊</button>
        </div>
      </div>
    </div>
  );
}

export default Flashcard;