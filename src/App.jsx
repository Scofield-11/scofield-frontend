import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { AnimatePresence, motion } from "framer-motion";
import 'react-toastify/dist/ReactToastify.css';

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import FlashcardMode from "./components/FlashcardMode";
import LearnMode from "./components/LearnMode";
import TestMode from "./components/TestMode";
import MatchMode from "./components/MatchMode";
import ExamMode from './components/ExamMode';
import KanjiDictionary from "./pages/KanjiDictionary"; // THÊM DÒNG NÀY
import NotFound from "./pages/NotFound";
import { VocabProvider } from "./context/VocabContext";

// Component bọc từng trang để tạo hiệu ứng
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// Component xử lý hiệu ứng khi đổi Route
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/flashcards" element={<PageWrapper><FlashcardMode /></PageWrapper>} />
        <Route path="/learn" element={<PageWrapper><LearnMode /></PageWrapper>} />
        <Route path="/test" element={<PageWrapper><TestMode /></PageWrapper>} />
        <Route path="/match" element={<PageWrapper><MatchMode /></PageWrapper>} />
        <Route path="/exam" element={<PageWrapper><ExamMode /></PageWrapper>} />
        <Route path="/kanji" element={<PageWrapper><KanjiDictionary /></PageWrapper>} /> {/* THÊM DÒNG NÀY */}
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [isUnlocked, setIsUnlocked] = useState(
    sessionStorage.getItem("app_unlocked") === "true"
  );
  const [passInput, setPassInput] = useState("");

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passInput === "matkhau123") { // Đổi mật khẩu của bạn tại đây
      sessionStorage.setItem("app_unlocked", "true");
      setIsUnlocked(true);
    } else {
      alert("Sai mật khẩu!");
    }
  };

  // Màn hình khóa
  if (!isUnlocked) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="card shadow-lg border-0 p-4 rounded-4 fade-in-slide" style={{ maxWidth: '400px', width: '90%' }}>
          <h3 className="text-center fw-bold text-primary mb-4">🔒 Khóa Truy Cập</h3>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              className="form-control form-control-lg bg-light border-0 mb-4 fw-bold shadow-sm"
              placeholder="Nhập mật khẩu..."
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold rounded-3">
              Mở Khóa
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Ứng dụng chính
  return (
    <VocabProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <div className="container-fluid py-4" style={{ maxWidth: '1200px' }}>
              <AnimatedRoutes />
            </div>
          </main>
        </div>
        <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
      </BrowserRouter>
    </VocabProvider>
  );
}

export default App;