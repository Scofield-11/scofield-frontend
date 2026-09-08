import React, { useState } from 'react';
import { toast } from 'react-toastify';

// Mock data ban đầu (mô phỏng Database)
const initialKanjiSets = [
  {
    id: 1,
    title: "Kanji N4 - Tuần 1",
    kanjis: [
      {
        id: 101, kanji: "料", hanviet: "LIỆU", onyomi: "リョウ", kunyomi: "はか.る", meaning: "Đo lường, vật liệu, phí",
        mnemonic: "Tôi đong lượng gạo (米) và các vật liệu khác bằng một cái cân.",
        examples: [
          { word: "料理", furigana: "りょうり", hanviet: "Liệu lí", meaning: "Thức ăn, nấu ăn" },
          { word: "無料", furigana: "むりょう", hanviet: "Vô liệu", meaning: "Miễn phí" }
        ]
      },
      {
        id: 102, kanji: "理", hanviet: "LÍ", onyomi: "リ", kunyomi: "ことわり", meaning: "Lí do, logic, sắp xếp",
        mnemonic: "Nhà vua (王) dùng Lí trí quản lí đất đai (里).",
        examples: [
          { word: "理由", furigana: "りゆう", hanviet: "Lí do", meaning: "Lí do" },
          { word: "無理", furigana: "むり", hanviet: "Vô lí", meaning: "Quá sức, vô lí" }
        ]
      }
    ]
  }
];

function KanjiDictionary() {
  const [kanjiSets, setKanjiSets] = useState(initialKanjiSets);
  const [selectedSetId, setSelectedSetId] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State cho phần Import
  const [isImportExpanded, setIsImportExpanded] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importText, setImportText] = useState("");

  const playAudio = (text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleImport = () => {
    if (!importTitle.trim()) return toast.warning("Vui lòng nhập tên học phần Kanji!");
    if (!importText.trim()) return toast.warning("Vui lòng nhập nội dung Import!");

    const lines = importText.trim().split('\n');
    const newKanjis = [];
    let errorCount = 0;

    lines.forEach((line) => {
      if (!line.trim()) return;
      const parts = line.split('|').map(p => p.trim());
      
      // Yêu cầu tối thiểu 5 cột: Kanji | Hán Việt | On | Kun | Nghĩa
      if (parts.length >= 5) {
        const examplesRaw = parts[6] || "";
        const examples = examplesRaw.split(',').map(ex => {
          const exParts = ex.split(':').map(p => p.trim());
          if (exParts.length >= 4) {
            return { word: exParts[0], furigana: exParts[1], hanviet: exParts[2], meaning: exParts[3] };
          }
          return null;
        }).filter(Boolean); // Lọc bỏ các ví dụ sai định dạng

        newKanjis.push({
          id: Date.now() + Math.random(),
          kanji: parts[0],
          hanviet: parts[1],
          onyomi: parts[2],
          kunyomi: parts[3],
          meaning: parts[4],
          mnemonic: parts[5] || "",
          examples: examples
        });
      } else {
        errorCount++;
      }
    });

    if (newKanjis.length > 0) {
      const newSet = {
        id: Date.now(),
        title: importTitle.trim(),
        kanjis: newKanjis
      };
      setKanjiSets([newSet, ...kanjiSets]);
      setSelectedSetId(newSet.id);
      setImportTitle("");
      setImportText("");
      setIsImportExpanded(false);
      toast.success(`Đã tạo học phần với ${newKanjis.length} chữ Kanji. ${errorCount > 0 ? `(Bỏ qua ${errorCount} dòng lỗi)` : ''}`);
    } else {
      toast.error("Không tìm thấy dữ liệu hợp lệ. Hãy kiểm tra lại dấu |");
    }
  };

  // Lọc dữ liệu theo Set và Search
  const currentSet = selectedSetId === 'all' 
    ? { kanjis: kanjiSets.flatMap(s => s.kanjis) } 
    : kanjiSets.find(s => s.id == selectedSetId) || { kanjis: [] };

  const filteredKanji = currentSet.kanjis.filter(k => 
    k.kanji.includes(searchTerm) || 
    k.hanviet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.examples.some(ex => ex.word.includes(searchTerm))
  );

  return (
    <div className="container-fluid mt-2 mb-5 mx-auto" style={{ maxWidth: '1100px' }}>
      
      {/* KHU VỰC IMPORT */}
      <div className="card shadow-sm mb-4 border-0 rounded-4 fade-in-slide">
        <div 
          className="card-header bg-white py-4 border-0 d-flex justify-content-between align-items-center rounded-4"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsImportExpanded(!isImportExpanded)}
        >
          <h5 className="mb-0 fw-bold text-primary">
            {isImportExpanded ? '➖' : '➕'} Tạo học phần Kanji mới (Import)
          </h5>
        </div>
        
        {isImportExpanded && (
          <div className="card-body p-4 border-top bg-light rounded-bottom-4">
            <input 
              type="text" 
              className="form-control form-control-lg mb-3 fw-bold border-0 shadow-sm" 
              placeholder="Tên học phần Kanji (VD: Kanji N3 - Tuần 1)..." 
              value={importTitle} onChange={(e) => setImportTitle(e.target.value)}
              style={{ borderRadius: '12px' }}
            />
            
            <div className="mb-3">
              <label className="text-muted small fw-bold mb-2">
                ĐỊNH DẠNG: <code className="bg-white px-2 py-1 rounded">Chữ Hán | Hán Việt | On | Kun | Nghĩa Kanji | Câu Mẹo | TừVựng1:PhiênÂm:HánViệt:Nghĩa, TừVựng2...</code>
              </label>
              <textarea 
                className="form-control border-0 shadow-sm p-3 fw-bold" 
                rows="6" 
                placeholder="料 | LIỆU | リョウ | はか.る | Đo lường, vật liệu, phí | Đong gạo bằng cân | 料理:りょうり:Liệu lí:Thức ăn, 無料:むりょう:Vô liệu:Miễn phí&#10;理 | LÍ | リ | ことわり | Lí do, logic | Vua dùng lí trí quản lí đất | 理由:りゆう:Lí do:Lí do"
                value={importText} onChange={(e) => setImportText(e.target.value)}
                style={{ borderRadius: '12px', lineHeight: '1.6', fontSize: '0.95rem' }}
              ></textarea>
            </div>
            
            <div className="d-flex justify-content-end">
              <button className="btn btn-primary px-5 py-2 fw-bold rounded-pill shadow-sm hover-scale" onClick={handleImport}>
                Tạo học phần
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HEADER TÌM KIẾM & CHỌN SET */}
      <div className="card shadow-sm border-0 rounded-4 bg-primary text-white mb-4 p-4 fade-in-slide">
        <h3 className="fw-bold mb-4">Từ điển Kanji ⛩️</h3>
        <div className="row g-3">
          <div className="col-md-4">
            <select 
              className="form-select form-select-lg border-0 shadow-sm rounded-pill fw-bold text-primary"
              value={selectedSetId} onChange={(e) => setSelectedSetId(e.target.value)}
            >
              <option value="all">-- Tất cả Kanji --</option>
              {kanjiSets.map(s => <option key={s.id} value={s.id}>{s.title} ({s.kanjis.length} chữ)</option>)}
            </select>
          </div>
          <div className="col-md-8">
            <div className="position-relative">
              <span className="position-absolute top-50 translate-middle-y ms-3 fs-5">🔍</span>
              <input 
                type="text" 
                className="form-control form-control-lg border-0 shadow-sm rounded-pill fw-bold text-dark" 
                placeholder="Tìm theo chữ Hán, Hán Việt hoặc từ vựng..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '3rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH KANJI */}
      <div className="d-flex flex-column gap-4 fade-in-slide">
        {filteredKanji.length === 0 ? (
          <div className="text-center text-muted mt-5 fw-bold fs-5">Khu vực này hiện đang trống.</div>
        ) : (
          filteredKanji.map((item) => (
            <div key={item.id} className="card shadow-sm border-0 rounded-4 overflow-hidden" style={{ transform: 'none' }}>
              <div className="row g-0">
                
                {/* Cột Trái: Chữ Hán */}
                <div className="col-md-3 bg-light d-flex flex-column align-items-center justify-content-center p-4 border-end">
                  <div className="fw-bold text-dark" style={{ fontSize: '6.5rem', lineHeight: '1', fontFamily: '"Yu Mincho", "MS Mincho", serif' }}>
                    {item.kanji}
                  </div>
                  <div className="fw-bold mt-2" style={{ fontSize: '1.4rem', color: '#8a2be2', letterSpacing: '2px' }}>
                    {item.hanviet}
                  </div>
                  <div className="text-muted small fw-bold mt-2 text-center px-2">{item.meaning}</div>
                </div>

                {/* Cột Phải: Thông tin & Từ vựng */}
                <div className="col-md-9 p-4 p-md-5 d-flex flex-column">
                  
                  <div className="mb-4 pb-4 border-bottom">
                    <div className="d-flex flex-wrap gap-3 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-danger fs-6 rounded-3 px-3 py-2 shadow-sm">ON</span>
                        <span className="fw-bold fs-5">{item.onyomi || "---"}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 ms-md-4">
                        <span className="badge bg-info text-dark fs-6 rounded-3 px-3 py-2 shadow-sm">KUN</span>
                        <span className="fw-bold fs-5">{item.kunyomi || "---"}</span>
                      </div>
                    </div>
                    {item.mnemonic && (
                      <div className="bg-white border rounded-3 p-3 text-muted fw-bold shadow-sm" style={{ borderLeft: '4px solid #8a2be2 !important' }}>
                        💡 {item.mnemonic}
                      </div>
                    )}
                  </div>

                  <h6 className="fw-bold text-muted mb-3">TỪ VỰNG KÈM THEO:</h6>
                  {item.examples.length === 0 ? (
                    <div className="text-muted fst-italic">Chưa có từ vựng ví dụ.</div>
                  ) : (
                    <div className="row g-3">
                      {item.examples.map((ex, idx) => (
                        <div className="col-lg-6" key={idx}>
                          <div className="d-flex align-items-start p-3 rounded-3 bg-light transition-all border hover-bg-white shadow-sm">
                            <button 
                              className="btn btn-sm btn-white rounded-circle shadow-sm border me-3 mt-1 hover-scale"
                              onClick={() => playAudio(ex.word)} title="Nghe phát âm"
                              style={{ width: '32px', height: '32px', flexShrink: 0 }}
                            >🔊</button>
                            <div>
                              <div className="mb-1">
                                <span className="fw-bold fs-5 text-dark me-2">{ex.word}</span>
                                <span className="text-muted fw-bold small">({ex.furigana})</span>
                              </div>
                              <div>
                                <span className="text-primary fw-bold" style={{ fontSize: '0.9rem' }}>[{ex.hanviet}]</span>
                                <span className="text-dark fw-bold ms-2">- {ex.meaning}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default KanjiDictionary;