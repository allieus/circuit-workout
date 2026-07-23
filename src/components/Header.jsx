import { navigate } from "../router";

export default function Header({ view, setView }) {
  const tabs = [
    { id: "home", label: "서킷" },
    { id: "library", label: "서고" },
    { id: "history", label: "기록" },
    { id: "contact", label: "문의" },
  ];
  return (
    <div className="header">
      <button className="btn header-logo-btn display header-logo" onClick={() => navigate("/")}>
        홈트 <span className="accent">뽑기</span>
      </button>
      <nav className="header-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`btn tab ${view === t.id ? "tab--active" : ""}`}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
