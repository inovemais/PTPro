import React, { useState } from "react";
import styles from "./styles.module.scss";
import Users from "./components/Users/index.jsx";

const navItems = [
  {
    id: "1",
    title: "Users",
    icon: (
      <svg className={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

const items = [
  {
    id: "1",
    title: "Users",
    children: <Users />,
  },
];

const AdminPage = () => {
  const [activePage, setActivePage] = useState("1");
  const activeItem = items.find(item => item.id === activePage);

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className={styles.logoTitle}>PTPro</h2>
        </div>
        
        <nav className={styles.navMenu}>
          {navItems.map((item) => {
            return (
              <div
                key={item.id}
                className={`${styles.navItem} ${item.id === activePage ? styles.active : ""}`}
                onClick={() => setActivePage(item.id)}
              >
                {item.icon}
                <span>{item.title}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>{activeItem?.title || "Dashboard"}</h1>
        </div>
        
        <div className={styles.contentArea}>
          {activeItem?.children}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
