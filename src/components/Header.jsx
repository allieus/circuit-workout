export default function Header({ view, setView }) {
  const tabs = [
    { id: "home", label: "서킷" },
    { id: "library", label: "서고" },
    { id: "history", label: "기록" },
    { id: "contact", label: "문의" },
  ];
  return (
    <div className="header">
      <div className="display header-logo">
        서킷 <span className="accent">뽑기</span>
      </div>
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
