export default function Header({ view, setView }) {
  return (
    <div className="header">
      <div className="display header-logo">
        서킷 <span className="accent">뽑기</span>
      </div>
      <nav className="header-tabs">
        <button className={`btn tab ${view === "home" ? "tab--active" : ""}`} onClick={() => setView("home")}>
          오늘의 서킷
        </button>
        <button className={`btn tab ${view === "library" ? "tab--active" : ""}`} onClick={() => setView("library")}>
          동작 서고
        </button>
        <button className={`btn tab ${view === "history" ? "tab--active" : ""}`} onClick={() => setView("history")}>
          기록
        </button>
      </nav>
    </div>
  );
}
