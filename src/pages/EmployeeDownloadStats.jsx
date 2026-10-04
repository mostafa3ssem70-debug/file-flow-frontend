import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Building2,
    CalendarClock,
    Download,
    FileText,
    LoaderCircle,
    RefreshCw,
    UserRound,
} from 'lucide-react';
import API from '../api/axios';
import './EmployeeDownloadStats.css';

const formatDateTime = (date) => new Intl.DateTimeFormat('ar', {
    dateStyle: 'medium',
    timeStyle: 'short',
}).format(new Date(date));

const EmployeeDownloadStats = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await API.get('/files/download-stats');
            setEmployees(response.data);
            setSelectedEmployeeId((currentId) => (
                response.data.some((employee) => employee._id === currentId)
                    ? currentId
                    : response.data[0]?._id || null
            ));
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'تعذر تحميل إحصاءات التنزيل. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        API.get('/files/download-stats')
            .then((response) => {
                if (!isActive) return;
                setEmployees(response.data);
                setSelectedEmployeeId(response.data[0]?._id || null);
            })
            .catch((requestError) => {
                if (isActive) {
                    setError(requestError.response?.data?.message || 'تعذر تحميل إحصاءات التنزيل. حاول مرة أخرى.');
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
        () => employees.find((employee) => employee._id === selectedEmployeeId),
        [employees, selectedEmployeeId],
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
                >
                    {isLoading
                        ? <LoaderCircle className="is-spinning" size={17} />
                        : <RefreshCw size={17} />}
                    <span>تحديث البيانات</span>
                </button>
            </header>

            {error && (
                <div className="download-stats__error" role="alert">
                    <AlertCircle size={19} />
                    <span>{error}</span>
                    <button type="button" onClick={fetchStats}>إعادة المحاولة</button>
                </div>
            )}

            {isLoading && employees.length === 0 ? (
                <div className="download-stats__state">
                    <LoaderCircle className="is-spinning" size={28} />
                    <span>جارٍ تحميل إحصاءات الموظفين...</span>
                </div>
            ) : (
                <>
                    <div className="download-stats__section-heading">
                        <div>
                            <h2>حسابات الموظفين</h2>
                            <p>اختر حسابًا لعرض سجل تنزيلاته.</p>
                        </div>
                        <span className="download-stats__employee-count">{employees.length} موظف</span>
                    </div>

                    {employees.length === 0 ? (
                        <div className="download-stats__empty">
                            <UserRound size={26} />
                            <h3>لا توجد حسابات موظفين</h3>
                            <p>ستظهر الحسابات هنا بعد إضافتها إلى النظام.</p>
                        </div>
                    ) : (
                        <div className="download-stats__employees">
                            {employees.map((employee) => (
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
                                    </span>
                                    <span className="download-stats__count">
                                        <strong>{employee.downloadCount}</strong>
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

                            {selectedEmployee.downloads.length === 0 ? (
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
