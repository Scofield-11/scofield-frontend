import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';
import EditKanjiModal from '../components/EditKanjiModal';
import LoadingSkeleton from '../components/LoadingSkeleton';

function KanjiDictionary() {
  const [kanjiSets, setKanjiSets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isImportExpanded, setIsImportExpanded] = useState(false);
  const [expandedSets, setExpandedSets] = useState({});
  
  const [importTitle, setImportTitle] = useState("");
  const [importText, setImportText] = useState("");
  const [editingKanji, setEditingKanji] = useState(null);

  const fetchKanjiSets = async () => {
    try {
      const res = await api.get('/kanji-sets');
      setKanjiSets(res.data);
    } catch (error) {
      console.error("Kanji fetch error:", error.response?.status, error.response?.data, error.message);
      toast.error(error.response?.data?.detail || `Lỗi Kanji: ${error.response?.status || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKanjiSets();
  }, []);

  const handleImport = async () => {
    if (!importTitle.trim()) return toast.warning("Vui lòng nhập tên học phần Kanji!");
    if (!importText.trim()) return toast.warning("Vui lòng nhập nội dung Import!");

    try {
      const res = await api.post("/kanji-sets/bulk-import", {
        title: importTitle.trim(),
        raw_text: importText
      });
      toast.success(res.data.message);
      setImportTitle("");
      setImportText("");
      setIsImportExpanded(false);
      fetchKanjiSets();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Lỗi tạo học phần. Hãy kiểm tra lại định dạng.");
    }
  };

  const handleDeleteSet = async (e, setId, title) => {
    e.stopPropagation();
    if (window.confirm(`Xóa toàn bộ học phần "${title}"?`)) {
      try {
        await api.delete(`/kanji-sets/${setId}`);
        toast.success("Đã xóa học phần!");
        fetchKanjiSets();
      } catch (error) {
        toast.error("Xóa thất bại!");
      }
    }
  };

  const handleDeleteKanji = async (kanjiId) => {
    if (window.confirm("Xóa chữ Kanji này?")) {
      try {
        await api.delete(`/kanji/${kanjiId}`);
        toast.success("Đã xóa chữ Kanji!");
        fetchKanjiSets();
      } catch (error) {
        toast.error("Lỗi xóa chữ Kanji");
      }
    }
  };

  const handleUpdateSuccess = (updatedKanji) => {
    setEditingKanji(null);
    toast.success("Cập nhật thành công!");
    fetchKanjiSets();
  };

  const toggleSet = (setId) => {
    setExpandedSets(prev => ({ ...prev, [setId]: !prev[setId] }));
  };

  const isSearching = searchTerm.trim().length > 0;

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

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="container-fluid mt-2 mb-5 mx-auto" style={{ maxWidth: '1000px' }}>
      
      {editingKanji && (
        <EditKanjiModal 
          kanjiItem={editingKanji} 
          onClose={() => setEditingKanji(null)} 
          onUpdateSuccess={handleUpdateSuccess} 
        />
      )}

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
            const isExpanded = isSearching || expandedSets[set.id];

            return (
              <div key={set.id} className="card shadow-sm border-0 rounded-4 overflow-hidden">
                
                <div 
                  className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center transition-all hover-bg-light"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleSet(set.id)}
                >
                  <div>
                    <h5 className="mb-0 fw-bold text-dark d-inline-block me-3">{set.title}</h5>
                    <span className="badge bg-light text-primary border px-2 py-1 fs-6">{set.kanjis.length} từ</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-light text-danger fw-bold border-0 px-3 py-2" onClick={(e) => handleDeleteSet(e, set.id, set.title)}>🗑️ Xóa</button>
                    <span className="text-muted fs-5 bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '36px', height: '36px' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="card-body p-0 border-top bg-light fade-in">
                    <div className="list-group list-group-flush rounded-bottom-4">
                      {set.kanjis.map((item) => (
                        <div key={item.id} className="list-group-item bg-white p-4 border-bottom border-light hover-bg-light transition-all position-relative">
                          <div className="row align-items-center g-3 text-center text-md-start">
                            
                            <div className="col-12 col-md-3 border-end-md">
                              <div className="fw-bold text-dark" style={{ fontSize: '2rem', fontFamily: '"Yu Mincho", "MS Mincho", serif' }}>
                                {item.kanji}
                              </div>
                            </div>
                            
                            <div className="col-12 col-md-3">
                              <div className="fw-bold" style={{ color: '#8a2be2', fontSize: '1.2rem', letterSpacing: '1px' }}>
                                {item.hanviet}
                              </div>
                            </div>
                            
                            <div className="col-12 col-md-3">
                              <div className="text-muted fw-bold fs-5">
                                {item.hiragana}
                              </div>
                            </div>
                            
                            <div className="col-12 col-md-2">
                              <div className="text-dark fw-bold fs-5">
                                {item.meaning}
                              </div>
                            </div>

                            <div className="col-12 col-md-1 text-end">
                              <div className="d-flex flex-md-column justify-content-center gap-2">
                                <button className="btn btn-sm btn-light text-primary fw-bold" onClick={() => setEditingKanji(item)}>✏️</button>
                                <button className="btn btn-sm btn-light text-danger fw-bold" onClick={() => handleDeleteKanji(item.id)}>🗑️</button>
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