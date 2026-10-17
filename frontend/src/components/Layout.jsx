export default function Layout({ children, sidebar, sidebarOpen, toggleSidebar }) {
  return (
    <div className="app">
      {sidebar && (
        <>
          <div className="sidebar-overlay visible" onClick={toggleSidebar} />
          <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            {sidebar}
          </aside>
        </>
      )}
      <div className="main">{children}</div>
    </div>
  );
}