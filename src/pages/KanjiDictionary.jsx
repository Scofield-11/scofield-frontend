import React, { useState } from 'react';
import { toast } from 'react-toastify';

// Mock data: Tạo sẵn 2 học phần và danh sách từ vựng
const initialKanjiSets = [
  {
    id: 1,
    title: "Từ vựng Kanji - Bài 1",
    kanjis: [
      { id: 101, kanji: "泳ぐ", hanviet: "VỊNH", hiragana: "およぐ", meaning: "Bơi" },
      { id: 102, kanji: "水泳", hanviet: "THỦY VỊNH", hiragana: "すいえい", meaning: "Bơi lội" },
      { id: 103, kanji: "天才", hanviet: "THIÊN TÀI", hiragana: "てんさい", meaning: "Thiên tài" },
      { id: 104, kanji: "才能", hanviet: "TÀI NĂNG", hiragana: "さいのう", meaning: "Tài năng" },
      { id: 105, kanji: "自分", hanviet: "TỰ PHÂN", hiragana: "じぶん", meaning: "Bản thân" }
    ]
  },
  {
    id: 2,
    title: "Từ vựng Kanji - Bài 2",
    kanjis: [
      { id: 201, kanji: "家", hanviet: "GIA", hiragana: "いえ", meaning: "Nhà" },
      { id: 202, kanji: "家族", hanviet: "GIA TỘC", hiragana: "かぞく", meaning: "Gia đình" },
      { id: 203, kanji: "水", hanviet: "THỦY", hiragana: "みず", meaning: "Nước" },
      { id: 204, kanji: "木", hanviet: "MỘC", hiragana: "き", meaning: "Cây" },
      { id: 205, kanji: "火", hanviet: "HỎA", hiragana: "ひ", meaning: "Lửa" }
    ]
  }
];

function KanjiDictionary() {
  const [kanjiSets, setKanjiSets] = useState(initialKanjiSets);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State đóng mở tab Import và các tab Học phần
  const [isImportExpanded, setIsImportExpanded] = useState(false);
  const [expandedSets, setExpandedSets] = useState({});
  
  const [importTitle, setImportTitle] = useState("");
  const [importText, setImportText] = useState("");

  const handleImport = () => {
    if (!importTitle.trim()) return toast.warning("Vui lòng nhập tên học phần Kanji!");
    if (!importText.trim()) return toast.warning("Vui lòng nhập nội dung Import!");

    const lines = importText.trim().split('\n');
    const newKanjis = [];
    let errorCount = 0;

    lines.forEach((line) => {
      if (!line.trim()) return;
      const parts = line.split('|').map(p => p.trim());
      
      // Yêu cầu 4 cột: Kanji | Hán Việt | Hiragana | Nghĩa
      if (parts.length >= 4) {
        newKanjis.push({
          id: Date.now() + Math.random(),
          kanji: parts[0],
          hanviet: parts[1],
          hiragana: parts[2],
          meaning: parts[3]
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
      setImportTitle("");
      setImportText("");
      setIsImportExpanded(false);
      
      // Tự động mở học phần vừa tạo
      setExpandedSets(prev => ({ ...prev, [newSet.id]: true }));
      toast.success(`Đã tạo học phần với ${newKanjis.length} từ vựng Kanji.`);
    } else {
      toast.error("Không tìm thấy dữ liệu hợp lệ. Hãy kiểm tra lại dấu |");
    }
  };

  const toggleSet = (setId) => {
    setExpandedSets(prev => ({
      ...prev,
      [setId]: !prev[setId]
    }));
  };

  const isSearching = searchTerm.trim().length > 0;

  // Lọc dữ liệu: Chỉ hiển thị những học phần có từ vựng khớp với kết quả tìm kiếm
  const displaySets = kanjiSets.map(set => {
    if (!isSearching) return set;
    
    const filteredKanjis = set.kanjis.filter(k => 
      (k.kanji && k.kanji.includes(searchTerm)) || 
      (k.hanviet && k.hanviet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (k.hiragana && k.hiragana.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (k.meaning && k.meaning.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return { ...set, kanjis: filteredKanjis };
  }).filter(set => set.kanjis.length > 0);

  return (
    <div className="container-fluid mt-2 mb-5 mx-auto" style={{ maxWidth: '1000px' }}>
      
      {/* KHU VỰC IMPORT */}
      <div className="card shadow-sm mb-4 border-0 rounded-4 fade-in-slide">
        <div 
          className="card-header bg-white py-4 border-0 d-flex justify-content-between align-items-center rounded-4 transition-all hover-bg-light"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsImportExpanded(!isImportExpanded)}
        >
          <h5 className="mb-0 fw-bold text-primary">
            {isImportExpanded ? '➖' : '➕'} Tạo học phần Kanji (Dán nhanh)
          </h5>
        </div>
        
        {isImportExpanded && (
          <div className="card-body p-4 border-top bg-light rounded-bottom-4">
            <input 
              type="text" 
              className="form-control form-control-lg mb-3 fw-bold border-0 shadow-sm" 
              placeholder="Tên học phần (VD: Từ vựng Kanji - Bài 3)..." 
              value={importTitle} onChange={(e) => setImportTitle(e.target.value)}
              style={{ borderRadius: '12px' }}
            />
            
            <div className="mb-3">
              <label className="text-muted small fw-bold mb-2">
                ĐỊNH DẠNG (4 Cột): <code className="bg-white px-2 py-1 rounded">Chữ Hán | Hán Việt | Cách đọc | Nghĩa</code>
              </label>
              <textarea 
                className="form-control border-0 shadow-sm p-3 fw-bold" 
                rows="5" 
                placeholder="家族 | GIA TỘC | かぞく | Gia đình&#10;旅行 | LỮ HÀNH | りょこう | Du lịch"
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

      {/* THANH TÌM KIẾM CHỈ ĐỊNH */}
      <div className="card shadow-sm border-0 rounded-4 bg-primary text-white mb-4 p-4 fade-in-slide">
        <h3 className="fw-bold mb-4">Kanji ⛩️</h3>
        <div className="position-relative">
          <span className="position-absolute top-50 translate-middle-y ms-3 fs-5">🔍</span>
          <input 
            type="text" 
            className="form-control form-control-lg border-0 shadow-sm rounded-pill fw-bold text-dark w-100" 
            placeholder="Tìm theo chữ Hán, Hán Việt, cách đọc, nghĩa..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '3.5rem', height: '56px' }}
          />
        </div>
      </div>

      {/* DANH SÁCH CÁC HỌC PHẦN (ACCORDION) */}
      <div className="d-flex flex-column gap-3 fade-in-slide">
        {displaySets.length === 0 ? (
          <div className="text-center text-muted mt-5 fw-bold fs-5">Không tìm thấy kết quả phù hợp.</div>
        ) : (
          displaySets.map((set) => {
            // Tự động xổ ra nếu đang search, nếu không thì dựa vào state expandedSets
            const isExpanded = isSearching || expandedSets[set.id];

            return (
              <div key={set.id} className="card shadow-sm border-0 rounded-4 overflow-hidden">
                
                {/* Thanh Tiêu Đề Học Phần */}
                <div 
                  className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center transition-all hover-bg-light"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleSet(set.id)}
                >
                  <div>
                    <h5 className="mb-0 fw-bold text-dark d-inline-block me-3">{set.title}</h5>
                    <span className="badge bg-light text-primary border px-2 py-1 fs-6">{set.kanjis.length} từ</span>
                  </div>
                  <span className="text-muted fs-5 bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '36px', height: '36px' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Danh Sách Từ Vựng Bên Trong Học Phần */}
                {isExpanded && (
                  <div className="card-body p-0 border-top bg-light fade-in">
                    <div className="list-group list-group-flush rounded-bottom-4">
                      {set.kanjis.map((item) => (
                        <div key={item.id} className="list-group-item bg-white p-4 border-bottom border-light hover-bg-light transition-all">
                          <div className="row align-items-center g-3 text-center text-md-start">
                            
                            {/* Cột 1: Chữ Hán to */}
                            <div className="col-12 col-md-3 border-end-md">
                              <div className="fw-bold text-dark" style={{ fontSize: '2rem', fontFamily: '"Yu Mincho", "MS Mincho", serif' }}>
                                {item.kanji}
                              </div>
                            </div>
                            
                            {/* Cột 2: Âm Hán Việt */}
                            <div className="col-12 col-md-3">
                              <div className="fw-bold" style={{ color: '#8a2be2', fontSize: '1.2rem', letterSpacing: '1px' }}>
                                {item.hanviet}
                              </div>
                            </div>
                            
                            {/* Cột 3: Hiragana */}
                            <div className="col-12 col-md-3">
                              <div className="text-muted fw-bold fs-5">
                                {item.hiragana}
                              </div>
                            </div>
                            
                            {/* Cột 4: Ý nghĩa */}
                            <div className="col-12 col-md-3">
                              <div className="text-dark fw-bold fs-5">
                                {item.meaning}
                              </div>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

export default KanjiDictionary;