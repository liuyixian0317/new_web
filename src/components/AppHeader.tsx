import "./AppHeader.css";

function AppHeader() {
  const handleStart = () => {
    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="app-header">
      <div className="app-header__branding">
        <img
          className="app-header__logo"
          src="/assets/midas-shiny-logo.svg"
          alt="MIDAS SHINY logo"
          width={48}
          height={48}
        />
        <div>
          <div className="app-header__title">MIDAS SHINY</div>
          <div className="app-header__subtitle">AI 潮玩创作平台</div>
        </div>
      </div>
      <nav className="app-header__nav">
        <a href="#composer">创意输入</a>
        <a href="#style-presets">潮玩风格</a>
        <a href="#history">生成记录</a>
      </nav>
      <button className="primary-btn" onClick={handleStart}>立即体验</button>
    </header>
  );
}

export default AppHeader;
