import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Building2,
    CalendarClock,
    Download,
    FileText,
    RefreshCw,
    UserRound,
} from 'lucide-react';
import API from '../api/axios';
import './EmployeeDownloadStats.css';

const formatDateTime = (date) => new Intl.DateTimeFormat('ar', {
    dateStyle: 'medium',
    timeStyle: 'short',
}).format(new Date(date));

const loadAccountsAndStats = async () => {
    const [accountsResult, statsResult] = await Promise.allSettled([
        API.get('/auth/users'),
        API.get('/files/download-stats'),
    ]);

    if (accountsResult.status === 'rejected') {
        throw accountsResult.reason;
    }

    const downloadStats = statsResult.status === 'fulfilled'
        ? new Map(statsResult.value.data.map((account) => [account._id, account]))
        : null;

    return {
        accounts: accountsResult.value.data.map((account) => {
            const stats = downloadStats?.get(account._id);
            return {
                ...account,
                downloadCount: stats?.downloadCount ?? 0,
                downloads: stats?.downloads ?? [],
            };
        }),
        statsError: statsResult.status === 'rejected'
            ? statsResult.reason.response?.status === 404
                ? 'تم جلب الحسابات، لكن مسار إحصاءات التنزيل غير موجود على الخادم. انشر آخر تحديث للباك إند لعرض سجل التنزيلات.'
                : statsResult.reason.response?.data?.message || 'تم جلب الحسابات، لكن تعذر تحميل سجلات التنزيل.'
            : '',
    };
};

const EmployeeDownloadStats = () => {
    const [accounts, setAccounts] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [statsError, setStatsError] = useState('');

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setStatsError('');
        try {
            const result = await loadAccountsAndStats();
            setAccounts(result.accounts);
            setStatsError(result.statsError);
            setSelectedEmployeeId((currentId) => (
                result.accounts.some((account) => account._id === currentId)
                    ? currentId
                    : result.accounts[0]?._id || null
            ));
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'تعذر تحميل الحسابات المسجلة. تحقق من الاتصال والصلاحيات ثم حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        loadAccountsAndStats()
            .then((result) => {
                if (!isActive) return;
                setAccounts(result.accounts);
                setStatsError(result.statsError);
                setSelectedEmployeeId(result.accounts[0]?._id || null);
            })
            .catch((requestError) => {
                if (isActive) {
                    setError(requestError.response?.data?.message || 'تعذر تحميل الحسابات المسجلة. تحقق من الاتصال والصلاحيات ثم حاول مرة أخرى.');
                }
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    const selectedEmployee = useMemo(
        () => accounts.find((account) => account._id === selectedEmployeeId),
        [accounts, selectedEmployeeId],
    );

    return (
        <section className="download-stats" dir="rtl">
            <header className="download-stats__header">
                <div className="download-stats__heading">
                    <span className="download-stats__heading-icon"><Download size={22} /></span>
                    <div>
                        <h1>إحصائيات التنزيل</h1>
                        <p>تابع الملفات التي نزّلها كل موظف مع تاريخ ووقت التنزيل.</p>
                    </div>
                </div>
                <button
                    className="download-stats__refresh"
                    type="button"
                    onClick={fetchStats}
                    disabled={isLoading}
                    aria-label="تحديث حسابات الموظفين وسجلات التنزيل"
                >
                    <RefreshCw
                        size={17}
                        className={isLoading ? 'is-spinning' : undefined}
                    />
                    <span>{isLoading ? 'جارٍ التحديث...' : 'تحديث البيانات'}</span>
                </button>
            </header>

            {error && (
                <div className="download-stats__error" role="alert">
                    <AlertCircle size={19} />
                    <span>{error}</span>
                    <button type="button" onClick={fetchStats}>إعادة المحاولة</button>
                </div>
            )}
            {statsError && (
                <div className="download-stats__error" role="status">
                    <AlertCircle size={19} />
                    <span>{statsError}</span>
                </div>
            )}

            {isLoading ? (
                <div className="download-stats__state">
                    <RefreshCw className="is-spinning" size={25} />
                    <strong>
                        {accounts.length === 0
                            ? 'جارٍ تحميل الحسابات وسجلات التنزيل...'
                            : 'جارٍ تحديث الحسابات وسجلات التنزيل...'}
                    </strong>
                </div>
            ) : (
                <>
                    <div className="download-stats__section-heading">
                        <div>
                            <h2>جميع الحسابات المسجلة</h2>
                            <p>اختر أي حساب لعرض سجل التنزيل المرتبط به.</p>
                        </div>
                        <span className="download-stats__employee-count">{accounts.length} حساب</span>
                    </div>

                    {accounts.length === 0 ? (
                        <div className="download-stats__empty">
                            <UserRound size={26} />
                            <h3>لا توجد حسابات مسجلة</h3>
                            <p>لم يتم العثور على أي حسابات في قاعدة بيانات النظام.</p>
                        </div>
                    ) : (
                        <div className="download-stats__employees">
                            {accounts.map((employee) => (
                                <button
                                    className={`download-stats__employee${selectedEmployeeId === employee._id ? ' is-selected' : ''}`}
                                    type="button"
                                    key={employee._id}
                                    onClick={() => setSelectedEmployeeId(employee._id)}
                                    aria-pressed={selectedEmployeeId === employee._id}
                                >
                                    <span className="download-stats__avatar">
                                        {employee.name?.trim().charAt(0) || <UserRound size={20} />}
                                    </span>
                                    <span className="download-stats__employee-info">
                                        <strong>{employee.name}</strong>
                                        <small><Building2 size={13} />{employee.department || 'General'}</small>
                                        <small className="download-stats__role">
                                            {employee.role === 'admin' ? 'مدير النظام' : 'موظف'}
                                        </small>
                                    </span>
                                    <span className="download-stats__count">
                                        <strong>{statsError ? '—' : employee.downloadCount}</strong>
                                        <small>تنزيل</small>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedEmployee && (
                        <section className="download-stats__history">
                            <header className="download-stats__history-header">
                                <div>
                                    <h2>سجل تنزيلات {selectedEmployee.name}</h2>
                                    <p>
                                        {selectedEmployee.downloadCount} عملية تنزيل
                                        <span> · </span>
                                        {selectedEmployee.department || 'General'}
                                    </p>
                                </div>
                                <span className="download-stats__history-icon"><CalendarClock size={20} /></span>
                            </header>

                            {statsError ? (
                                <div className="download-stats__empty download-stats__empty--history">
                                    <AlertCircle size={24} />
                                    <h3>سجل التنزيلات غير متاح</h3>
                                    <p>بعد نشر تحديث الباك إند ستظهر هنا الملفات التي نزّلها هذا الحساب.</p>
                                </div>
                            ) : selectedEmployee.downloads.length === 0 ? (
                                <div className="download-stats__empty download-stats__empty--history">
                                    <Download size={24} />
                                    <h3>لا توجد تنزيلات مسجلة</h3>
                                    <p>ستظهر الملفات هنا بعد تنزيل الموظف لها.</p>
                                </div>
                            ) : (
                                <div className="download-stats__table-wrap">
                                    <table className="download-stats__table">
                                        <thead>
                                            <tr>
                                                <th>الملف</th>
                                                <th>القسم</th>
                                                <th>تاريخ ووقت التنزيل</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedEmployee.downloads.map((download) => (
                                                <tr key={download._id}>
                                                    <td>
                                                        <span className="download-stats__file-name">
                                                            <FileText size={17} />
                                                            {download.fileName}
                                                        </span>
                                                    </td>
                                                    <td>{download.department || 'General'}</td>
                                                    <td className="download-stats__date">
                                                        <CalendarClock size={15} />
                                                        {formatDateTime(download.downloadedAt)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}
        </section>
    );
};

export default EmployeeDownloadStats;
