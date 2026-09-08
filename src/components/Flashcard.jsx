import { useState, useEffect } from "react";
import { playSound } from '../utils/audio'; // Import bộ máy âm thanh

function Flashcard({ vocab, autoPlay, frontSide = 'word', backSide = 'meaning', onEdit, onSaveNote }) {
  const [flipped, setFlipped] = useState(false);

  const handleOpenNote = (e) => {
    e.stopPropagation();
    if (onSaveNote) onSaveNote(vocab);
  };

  const detectLanguage = (text, type) => {
    if (type === 'meaning') return 'vi-VN';
    if (!text) return 'en-US';
    const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
    return hasJapanese ? 'ja-JP' : 'en-US';
  };

  const getText = (side) => {
    if (side === 'word') return vocab.word;
    return vocab.meaning;
  };

  const frontText = getText(frontSide);
  const backText = getText(backSide);
  
  const frontLang = detectLanguage(frontText, frontSide);
  const backLang = detectLanguage(backText, backSide);

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
  }, [vocab, autoPlay, frontSide, backSide]);

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
          
          <span>{frontText}</span>
          
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
          
          <span>{backText}</span>
          
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