import { NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import ActionAlert from './ActionAlert';
import './Sidebar.css';
import {
    LayoutDashboard,
    Upload,
    UserPlus,
    LogOut,
    FolderKanban,
    ChartNoAxesColumn,
    X,
} from 'lucide-react';

const Sidebar = ({ isMobileOpen = false, onNavigate }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [actionAlert, setActionAlert] = useState(null);

    const handleLogout = () => {
        setActionAlert({
            type: 'confirm',
            title: 'تأكيد تسجيل الخروج',
            message: 'هل تريد تسجيل الخروج من حسابك الآن؟',
            confirmLabel: 'تسجيل الخروج',
            onConfirm: () => {
                logout();
                navigate('/login');
            },
        });
    };

    return (
        <aside className={`admin-sidebar${isMobileOpen ? ' is-mobile-open' : ''}`} style={styles.sidebar}>
            <button
                className="admin-sidebar__close"
                type="button"
                onClick={onNavigate}
                aria-label="إغلاق القائمة الجانبية"
            >
                <X size={21} />
            </button>
            <div style={styles.brand}>
                <div style={styles.brandIconWrap}>
                    <FolderKanban size={26} color="#60a5fa" />
                </div>
                <div>
                    <h2 style={styles.brandTitle}>نظام إدارة الملفات</h2>
                </div>
            </div>

            <div style={styles.userInfo}>
                <div style={styles.avatar}>{user?.name?.charAt(0) || 'م'}</div>
                <div>
                    <p style={styles.userName}>{user?.name || 'المستخدم'}</p>
                    <span style={styles.userRole}>
                        {user?.role === 'admin' ? 'مدير النظام' : 'موظف'}
                    </span>
                </div>
            </div>

            <nav style={styles.navGroup}>
                <NavLink
                    to="/admin"
                    end
                    onClick={onNavigate}
                    style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
                >
                    <span style={styles.iconWrap}><LayoutDashboard size={18} /></span>
                    <span>لوحة التحكم</span>
                </NavLink>

                <NavLink
                    to="/admin/upload"
                    onClick={onNavigate}
                    style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
                >
                    <span style={styles.iconWrap}><Upload size={18} /></span>
                    <span>رفع الملفات</span>
                </NavLink>



                {user?.role === 'admin' && (
                    <NavLink
                        to="/admin/download-stats"
                        onClick={onNavigate}
                        style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
                    >
                        <span style={styles.iconWrap}><ChartNoAxesColumn size={18} /></span>
                        <span>إحصائيات التنزيل</span>
                    </NavLink>
                )}
                {user?.role === 'admin' && (
                    <NavLink
                        to="/admin/create-user"
                        onClick={onNavigate}
                        style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
                    >
                        <span style={styles.iconWrap}><UserPlus size={18} /></span>
                        <span>إنشاء حساب جديد</span>
                    </NavLink>
                )}
            </nav>

            <button onClick={handleLogout} style={styles.logoutBtn} type="button">
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
            </button>
            <ActionAlert
                alert={actionAlert}
                onClose={() => setActionAlert(null)}
                onConfirm={actionAlert?.onConfirm}
            />
        </aside>
    );
};

const styles = {
    sidebar: {
        width: '280px',
        height: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px',
        position: 'fixed',
        right: 0,
        top: 0,
        boxSizing: 'border-box',
        boxShadow: '0 0 25px rgba(15, 23, 42, 0.35)',
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 10px 18px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        marginBottom: '20px',
    },
    brandIconWrap: {
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        background: 'rgba(96, 165, 250, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(96, 165, 250, 0.25)',
    },
    brandTitle: {
        fontSize: '17px',
        margin: 0,
        fontWeight: '700',
        color: '#e2e8f0',
    },
    userInfo: {
        background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(15,23,42,0.4))',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        padding: '12px 12px',
        borderRadius: '16px',
        marginBottom: '22px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatar: {
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        color: '#fff',
        fontSize: '18px',
    },
    userName: {
        margin: 0,
        fontSize: '14px',
        fontWeight: '700',
        color: '#f8fafc',
    },
    userRole: {
        fontSize: '12px',
        color: '#cbd5e1',
    },
    navGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexGrow: 1,
    },
    link: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        color: '#cbd5e1',
        textDecoration: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.25s ease',
        border: '1px solid transparent',
    },
    activeLink: {
        background: 'linear-gradient(90deg, rgba(59,130,246,0.28), rgba(96,165,250,0.1))',
        color: '#ffffff',
        border: '1px solid rgba(96, 165, 250, 0.3)',
        boxShadow: '0 10px 18px rgba(37, 99, 235, 0.2)',
    },
    iconWrap: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '12px 14px',
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '700',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 10px 18px rgba(239, 68, 68, 0.25)',
    },
};

export default Sidebar;