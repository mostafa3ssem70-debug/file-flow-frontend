import { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    Building2,
    CalendarDays,
    Download,
    Eye,
    FileText,
    FolderOpen,
    LayoutDashboard,
    LogOut,
    Menu,
    RefreshCw,
    Search,
    UserRound,
    X,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ActionAlert from '../components/ActionAlert';
import API from '../api/axios';
import { downloadFile, previewFile } from '../utils/fileActions';
import './EmployeeDashboard.css';

const getFiles = async () => {
    const response = await API.get('/files');
    return response.data;
};

const EmployeeDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [fileActionError, setFileActionError] = useState('');
    const [actionAlert, setActionAlert] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const refreshFiles = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setIsLoading(true);
        setError('');
        try {
            setFiles(await getFiles());
        } catch {
            setError('تعذر تحميل ملفات القسم. تحقق من الاتصال ثم حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    useEffect(() => {
        let isActive = true;
        getFiles()
            .then((loadedFiles) => {
                if (isActive) {
                    setFiles(loadedFiles);
                }
            })
            .catch(() => {
                if (isActive) setError('تعذر تحميل ملفات القسم. تحقق من الاتصال ثم حاول مرة أخرى.');
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

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

    const handleFileAction = async (file, action) => {
        setFileActionError('');
        try {
            if (action === 'preview') {
                await previewFile(file._id);
            } else {
                await downloadFile(file._id, file.originalName);
            }
        } catch {
            setFileActionError(action === 'preview'
                ? 'تعذر عرض الملف. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى.'
                : 'تعذر تنزيل الملف. حاول مرة أخرى.');
        }
    };

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    const filteredFiles = files.filter((file) => (
        [file.originalName, file.department, file.uploadedBy?.name]
            .filter(Boolean)
            .some((value) => value.toLocaleLowerCase().includes(normalizedSearch))
    ));

    return (
        <div className="employee-shell" dir="rtl">
            {isSidebarOpen && (
                <button
                    className="employee-sidebar-backdrop"
                    type="button"
                    aria-label="إغلاق القائمة الجانبية"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <aside className={`employee-sidebar${isSidebarOpen ? ' is-mobile-open' : ''}`} aria-label="القائمة الجانبية">
                <button
                    className="employee-sidebar__close"
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-label="إغلاق القائمة الجانبية"
                >
                    <X size={21} />
                </button>
                <div className="employee-sidebar__brand">
                    <span className="employee-sidebar__brand-icon">
                        <FolderOpen size={23} />
                    </span>
                    <div>
                        <strong>FileFlow</strong>
                        <span>نظام إدارة الملفات</span>
                    </div>
                </div>

                <section className="employee-sidebar__profile" aria-label="بيانات المستخدم">
                    <span className="employee-sidebar__avatar" aria-hidden="true">
                        {user?.name?.trim()?.charAt(0) || <UserRound size={22} />}
                    </span>
                    <div className="employee-sidebar__user">
                        <strong>{user?.name || 'المستخدم'}</strong>
                        <span>موظف</span>
                    </div>
                    <div className="employee-sidebar__department">
                        <Building2 size={15} />
                        <span>{user?.department || 'القسم غير محدد'}</span>
                    </div>
                </section>

                <span className="employee-sidebar__section-label">القائمة الرئيسية</span>
                <nav className="employee-sidebar__nav">
                    <Link
                        className="employee-sidebar__link is-active"
                        to="/employee"
                        aria-current="page"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <LayoutDashboard size={19} />
                        <span>لوحة الموظف</span>
                    </Link>
                </nav>

                <button className="employee-sidebar__logout" type="button" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>تسجيل الخروج</span>
                </button>
            </aside>

            <main className="employee-main">
            <div className="employee-mobile-bar">
                <button
                    className="employee-mobile-bar__menu"
                    type="button"
                    onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
                    aria-label={isSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                    aria-expanded={isSidebarOpen}
                >
                    {isSidebarOpen ? <X size={21} /> : <Menu size={21} />}
                </button>
                <strong>ملفات قسمك</strong>
            </div>
            <div className="employee-dashboard">
            <header className="employee-dashboard__hero">
                <div className="employee-dashboard__hero-copy">
                    <span className="employee-dashboard__eyebrow">
                        <span className="employee-dashboard__eyebrow-dot" />
                        مساحة عملك
                    </span>
                    <div className="employee-dashboard__title-row">
                        <span className="employee-dashboard__title-icon" aria-hidden="true">
                            <FolderOpen size={25} strokeWidth={2} />
                        </span>
                        <div>
                            <h1>ملفات قسمك</h1>
                            <p>مرحباً {user?.name || 'بك'}، يمكنك استعراض الملفات المتاحة لقسمك.</p>
                        </div>
                    </div>
                    <span className="employee-dashboard__department">
                        <Building2 size={15} />
                        {user?.department || 'القسم'}
                    </span>
                </div>

                <div className="employee-dashboard__hero-actions">
                    <button
                        className="employee-dashboard__refresh"
                        type="button"
                        onClick={refreshFiles}
                        disabled={isLoading || isRefreshing}
                        aria-label="تحديث بيانات الملفات"
                    >
                        <RefreshCw
                            size={17}
                            className={isRefreshing ? 'employee-dashboard__refresh-icon is-spinning' : 'employee-dashboard__refresh-icon'}
                        />
                        <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث البيانات'}</span>
                    </button>
                </div>
            </header>

            <section className="employee-dashboard__stats" aria-label="ملخص ملفات القسم">
                <article className="employee-dashboard__stat-card">
                    <span className="employee-dashboard__stat-icon">
                        <FileText size={21} />
                    </span>
                    <div>
                        <span className="employee-dashboard__stat-label">ملفات القسم</span>
                        <strong>{files.length}</strong>
                    </div>
                </article>
                <article className="employee-dashboard__stat-card employee-dashboard__stat-card--note">
                    <span className="employee-dashboard__stat-icon employee-dashboard__stat-icon--green">
                        <Building2 size={21} />
                    </span>
                    <div>
                        <span className="employee-dashboard__stat-label">القسم الحالي</span>
                        <strong className="employee-dashboard__department-value">{user?.department || 'غير محدد'}</strong>
                    </div>
                </article>
            </section>

            <section className="employee-dashboard__files" aria-labelledby="employee-files-title">
                <div className="employee-dashboard__list-heading">
                    <div>
                        <h2 id="employee-files-title">الملفات المتاحة</h2>
                        <p>اعرض الملف أو نزّله للرجوع إليه في أي وقت.</p>
                    </div>
                    <span className="employee-dashboard__file-count">{filteredFiles.length} ملف</span>
                </div>

                <label className="employee-dashboard__search">
                    <Search size={19} aria-hidden="true" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="ابحث عن ملف..."
                        aria-label="البحث في ملفات القسم"
                    />
                    {searchTerm && (
                        <button
                            className="employee-dashboard__clear-search"
                            type="button"
                            onClick={() => setSearchTerm('')}
                            aria-label="مسح البحث"
                        >
                            <X size={17} />
                        </button>
                    )}
                </label>

                {error && (
                    <div className="employee-dashboard__error" role="alert">
                        <AlertCircle size={19} />
                        <span>{error}</span>
                        <button type="button" onClick={refreshFiles}>إعادة المحاولة</button>
                    </div>
                )}
                {fileActionError && (
                    <div className="employee-dashboard__error" role="alert">
                        <AlertCircle size={19} />
                        <span>{fileActionError}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="employee-dashboard__state" role="status">
                        <RefreshCw className="employee-dashboard__state-spinner" size={25} />
                        <strong>جارٍ تحميل الملفات...</strong>
                    </div>
                ) : filteredFiles.length > 0 ? (
                    <div className="employee-dashboard__grid">
                        {filteredFiles.map((file) => (
                            <article className="employee-file-card" key={file._id}>
                                <div className="employee-file-card__top">
                                    <span className="employee-file-card__icon">
                                        <FileText size={23} />
                                    </span>
                                    <span className="employee-file-card__department">
                                        <Building2 size={14} />
                                        {user?.department || file.department || 'عام'}
                                    </span>
                                </div>

                                <div className="employee-file-card__details">
                                    <h3 dir="auto" title={file.originalName}>{file.originalName}</h3>
                                    <p className="employee-file-card__meta">
                                        <UserRound size={15} />
                                        <span>{file.uploadedBy?.name || 'غير معروف'}</span>
                                    </p>
                                    <p className="employee-file-card__meta">
                                        <CalendarDays size={15} />
                                        <span>
                                            {new Date(file.createdAt).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </p>
                                </div>

                                <div className="employee-file-card__actions">
                                    <button
                                        className="employee-file-card__action employee-file-card__action--view"
                                        type="button"
                                        onClick={() => handleFileAction(file, 'preview')}
                                    >
                                        <Eye size={16} />
                                        <span>عرض الملف</span>
                                    </button>
                                    <button
                                        className="employee-file-card__action employee-file-card__action--download"
                                        type="button"
                                        onClick={() => handleFileAction(file, 'download')}
                                    >
                                        <Download size={16} />
                                        <span>تنزيل</span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="employee-dashboard__empty">
                        <span className="employee-dashboard__empty-icon">
                            {searchTerm ? <Search size={27} /> : <FolderOpen size={27} />}
                        </span>
                        <h3>{searchTerm ? 'لا توجد نتائج مطابقة' : 'لا توجد ملفات بعد'}</h3>
                        <p>
                            {searchTerm
                                ? 'جرّب البحث بكلمات مختلفة أو امسح البحث لعرض جميع الملفات.'
                                : 'ستظهر هنا الملفات التي تتم مشاركتها مع قسمك.'}
                        </p>
                        {searchTerm && (
                            <button
                                className="employee-dashboard__empty-button"
                                type="button"
                                onClick={() => setSearchTerm('')}
                            >
                                مسح البحث
                            </button>
                        )}
                    </div>
                )}
            </section>
            </div>
            </main>
            <ActionAlert
                alert={actionAlert}
                onClose={() => setActionAlert(null)}
                onConfirm={actionAlert?.onConfirm}
            />
        </div>
    );
};

export default EmployeeDashboard;
