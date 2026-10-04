import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="dashboard-layout">
            <Sidebar
                isMobileOpen={isSidebarOpen}
                onNavigate={() => setIsSidebarOpen(false)}
            />
            {isSidebarOpen && (
                <button
                    className="dashboard-layout__backdrop"
                    type="button"
                    aria-label="إغلاق القائمة الجانبية"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="dashboard-layout__main">
                <div className="dashboard-layout__mobile-bar">
                    <button
                        className="dashboard-layout__menu-button"
                        type="button"
                        onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
                        aria-label={isSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                        aria-expanded={isSidebarOpen}
                    >
                        {isSidebarOpen ? <X size={21} /> : <Menu size={21} />}
                    </button>
                    <strong>لوحة الإدارة</strong>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;