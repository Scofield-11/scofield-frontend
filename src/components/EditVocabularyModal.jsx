import { useState } from "react";
import api from "../api/axiosConfig";

function EditVocabularyModal({ vocab, onClose, onUpdateSuccess }) {
  const [word, setWord] = useState(vocab.word);
  const [meaning, setMeaning] = useState(vocab.meaning);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) {
      setError("Vui lòng nhập đầy đủ từ vựng và ý nghĩa");
      return;
    }

    try {
      setSaving(true);
      const res = await api.put(`/vocabularies/${vocab.id}`, {
        word: word.trim(),
        meaning: meaning.trim(),
      });
      onUpdateSuccess(res.data);
    } catch (err) {
      setError("Có lỗi xảy ra khi lưu thay đổi");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Sửa từ vựng</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Từ vựng</label>
                <input
                  type="text"
                  className="form-control"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Ý nghĩa</label>
                <input
                  type="text"
                  className="form-control"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                />
              </div>
              {error && <p className="text-danger">{error}</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditVocabularyModal;