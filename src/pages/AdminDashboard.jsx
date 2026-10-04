import { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertCircle,
    Building2,
    CalendarDays,
    Download,
    Check,
    FileText,
    FolderOpen,
    LoaderCircle,
    Pencil,
    RefreshCw,
    Search,
    Trash2,
    Upload,
    UserRound,
    UsersRound,
    X,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ActionAlert from '../components/ActionAlert';
import API from '../api/axios';
import { downloadFile } from '../utils/fileActions';
import './AdminDashboard.css';

const requestFiles = async () => {
    const response = await API.get('/files');
    return response.data;
};

const getFileDepartments = (file) => {
    const departments = Array.isArray(file.departments) && file.departments.length > 0
        ? file.departments
        : [file.department];

    return [...new Set(
        departments
            .filter((department) => typeof department === 'string' && department.trim())
            .map((department) => department.trim()),
    )];
};

const getSharedUserIds = (sharedWith) => (
    Array.isArray(sharedWith)
        ? sharedWith.map((account) => (
            typeof account === 'string' ? account : account?._id || account?.id
        )).filter(Boolean).map(String)
        : []
);

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [files, setFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [deletingFileId, setDeletingFileId] = useState(null);
    const [editingFile, setEditingFile] = useState(null);
    const [editDepartments, setEditDepartments] = useState([]);
    const [editAccessMode, setEditAccessMode] = useState('department');
    const [editDepartmentUsers, setEditDepartmentUsers] = useState([]);
    const [editSelectedUserIds, setEditSelectedUserIds] = useState([]);
    const [editUserSearch, setEditUserSearch] = useState('');
    const [isLoadingEditUsers, setIsLoadingEditUsers] = useState(false);
    const [isSavingAccess, setIsSavingAccess] = useState(false);
    const [editError, setEditError] = useState('');
    const [actionAlert, setActionAlert] = useState(null);
    const departments = ['Engineering', 'Management', 'HR', 'General'];

    const fetchFiles = useCallback(async () => {
        try {
            setFiles(await requestFiles());
        } catch {
            setError('تعذر تحميل الملفات. تحقق من الاتصال ثم حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setIsLoading(true);
        setError('');
        fetchFiles();
    };

    useEffect(() => {
        let isActive = true;

        requestFiles()
            .then((loadedFiles) => {
                if (isActive) setFiles(loadedFiles);
            })
            .catch(() => {
                if (isActive) setError('تعذر تحميل الملفات. تحقق من الاتصال ثم حاول مرة أخرى.');
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        if (!editingFile || editAccessMode !== 'users' || editDepartments.length === 0) {
            return undefined;
        }

        let isActive = true;
        Promise.all(editDepartments.map(async (department) => {
            const response = await API.get('/auth/department-users', {
                params: { department },
            });
            return response.data.map((account) => ({ ...account, department }));
        }))
            .then((usersByDepartment) => {
                if (isActive) setEditDepartmentUsers(usersByDepartment.flat());
            })
            .catch((requestError) => {
                if (isActive) {
                    setEditError(requestError.response?.data?.message || 'تعذر تحميل حسابات الأقسام.');
                }
            })
            .finally(() => {
                if (isActive) setIsLoadingEditUsers(false);
            });

        return () => {
            isActive = false;
        };
    }, [editingFile, editAccessMode, editDepartments]);

    const handleDelete = (file) => {
        setActionAlert({
            type: 'confirm',
            title: 'تأكيد حذف الملف',
            message: `هل أنت متأكد من حذف الملف "${file.originalName}"؟ لا يمكن التراجع عن هذا الإجراء.`,
            confirmLabel: 'حذف الملف',
            onConfirm: () => confirmDeleteFile(file),
        });
    };

    const confirmDeleteFile = async (file) => {
        setActionAlert(null);
        setDeletingFileId(file._id);
        setError('');

        try {
            await API.delete(`/files/${file._id}`);
            setFiles((currentFiles) => currentFiles.filter((item) => item._id !== file._id));
            setActionAlert({
                type: 'success',
                title: 'تم حذف الملف',
                message: `تم حذف "${file.originalName}" بنجاح.`,
            });
        } catch (requestError) {
            setActionAlert({
                type: 'error',
                title: 'تعذر حذف الملف',
                message: requestError.response?.data?.message || 'حدث خطأ أثناء حذف الملف. حاول مرة أخرى.',
            });
        } finally {
            setDeletingFileId(null);
        }
    };

    const handleDownload = async (file) => {
        setError('');

        try {
            await downloadFile(file._id, file.originalName);
        } catch {
            setError('تعذر تنزيل الملف. تحقق من صلاحية الوصول ثم حاول مرة أخرى.');
        }
    };

    const openEditModal = (file) => {
        setEditingFile(file);
        setEditDepartments(getFileDepartments(file));
        setEditAccessMode(file.accessMode === 'users' ? 'users' : 'department');
        setEditDepartmentUsers([]);
        setEditSelectedUserIds(getSharedUserIds(file.sharedWith));
        setEditUserSearch('');
        setEditError('');
        setIsLoadingEditUsers(file.accessMode === 'users' && getFileDepartments(file).length > 0);
    };

    const closeEditModal = () => {
        if (isSavingAccess) return;
        setEditingFile(null);
        setEditDepartmentUsers([]);
        setEditError('');
    };

    const toggleEditDepartment = (department) => {
        const nextDepartments = editDepartments.includes(department)
            ? editDepartments.filter((item) => item !== department)
            : [...editDepartments, department];
        setEditDepartments(nextDepartments);
        setEditSelectedUserIds([]);
        setEditDepartmentUsers([]);
        setEditError('');
        setIsLoadingEditUsers(editAccessMode === 'users' && nextDepartments.length > 0);
    };

    const toggleEditUser = (userId) => {
        const normalizedUserId = String(userId);
        setEditSelectedUserIds((current) => (
            current.includes(normalizedUserId)
                ? current.filter((id) => id !== normalizedUserId)
                : [...current, normalizedUserId]
        ));
    };

    const handleAccessSave = async (event) => {
        event.preventDefault();
        if (!editingFile) return;

        if (editDepartments.length === 0) {
            setEditError('اختر قسماً واحداً على الأقل.');
            return;
        }

        if (editAccessMode === 'users' && editSelectedUserIds.length === 0) {
            setEditError('اختر حساباً واحداً على الأقل.');
            return;
        }

        setIsSavingAccess(true);
        setEditError('');
        setError('');
        try {
            const response = await API.put(`/files/${editingFile._id}`, {
                departments: editDepartments,
                accessMode: editAccessMode,
                sharedWith: editAccessMode === 'users' ? editSelectedUserIds : [],
            });
            const updatedFile = response.data?.file || response.data;

            setFiles((currentFiles) => currentFiles.map((file) => (
                file._id === editingFile._id
                    ? {
                        ...file,
                        ...(updatedFile && typeof updatedFile === 'object' ? updatedFile : {}),
                        departments: editDepartments,
                        department: editDepartments[0],
                        accessMode: editAccessMode,
                        sharedWith: editAccessMode === 'users' ? editSelectedUserIds : [],
                    }
                    : file
            )));
            setEditingFile(null);
            setActionAlert({
                type: 'success',
                title: 'تم تعديل صلاحيات الملف',
                message: 'تم حفظ الأقسام والحسابات المسموح لها بالوصول إلى الملف.',
            });
        } catch (requestError) {
            const message = requestError.response?.data?.message || 'تعذر تحديث صلاحيات الملف. حاول مرة أخرى.';
            setEditError(message);
            setActionAlert({
                type: 'error',
                title: 'تعذر تعديل صلاحيات الملف',
                message,
            });
        } finally {
            setIsSavingAccess(false);
        }
    };

    const filteredEditUsers = editDepartmentUsers.filter((account) => (
        `${account.name} ${account.username}`.toLocaleLowerCase()
            .includes(editUserSearch.trim().toLocaleLowerCase())
    ));

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();

    const filteredFiles = files.filter((file) => {
        const searchableValues = [
            file.originalName,
            ...getFileDepartments(file),
            file.uploadedBy?.name,
        ];

        return searchableValues
            .filter(Boolean)
            .some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
    });

    const departmentCount = new Set(files.flatMap(getFileDepartments)).size;

    return (
        <section className="admin-dashboard" dir="rtl">
            <header className="admin-dashboard__hero">
                <div className="admin-dashboard__hero-copy">
                    <span className="admin-dashboard__eyebrow">
                        <span className="admin-dashboard__eyebrow-dot" />
                        لوحة تحكم المسؤول
                    </span>

                    <div className="admin-dashboard__title-row">
                        <span className="admin-dashboard__title-icon" aria-hidden="true">
                            <FolderOpen size={25} strokeWidth={2} />
                        </span>
                        <div>
                            <h1>إدارة الملفات</h1>
                            <p>مرحباً {user?.name || 'بك'}، إليك نظرة عامة على ملفات المؤسسة.</p>
                        </div>
                    </div>
                </div>

                <div className="admin-dashboard__hero-actions">
                    <button
                        className="admin-dashboard__refresh"
                        type="button"
                        onClick={handleRefresh}
                        disabled={isLoading || isRefreshing}
                        aria-label="تحديث قائمة الملفات"
                    >
                        <RefreshCw
                            size={17}
                            className={isRefreshing
                                ? 'admin-dashboard__refresh-icon is-spinning'
                                : 'admin-dashboard__refresh-icon'}
                        />
                        <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث البيانات'}</span>
                    </button>

                    <Link className="admin-dashboard__upload-button" to="/admin/upload">
                        <Upload size={18} />
                        <span>رفع ملف جديد</span>
                    </Link>
                </div>
            </header>

            <div className="admin-dashboard__stats" aria-label="ملخص الملفات">
                <article className="admin-dashboard__stat-card">
                    <span className="admin-dashboard__stat-icon admin-dashboard__stat-icon--blue">
                        <FileText size={21} />
                    </span>
                    <div>
                        <span className="admin-dashboard__stat-label">إجمالي الملفات</span>
                        <strong>{files.length}</strong>
                    </div>
                </article>

                <article className="admin-dashboard__stat-card">
                    <span className="admin-dashboard__stat-icon admin-dashboard__stat-icon--violet">
                        <Building2 size={21} />
                    </span>
                    <div>
                        <span className="admin-dashboard__stat-label">الأقسام النشطة</span>
                        <strong>{departmentCount}</strong>
                    </div>
                </article>
            </div>

            <div className="admin-dashboard__list-heading">
                <div>
                    <h2>الملفات المرفوعة</h2>
                    <p>استعرض الملفات وابحث عنها أو نفّذ إجراءً سريعاً.</p>
                </div>
                <span className="admin-dashboard__file-count">{filteredFiles.length} ملف</span>
            </div>

            <label className="admin-dashboard__search">
                <Search size={19} aria-hidden="true" />
                <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="ابحث باسم الملف أو القسم أو المنشئ..."
                    aria-label="البحث في الملفات"
                />
                {searchTerm && (
                    <button
                        type="button"
                        className="admin-dashboard__clear-search"
                        onClick={() => setSearchTerm('')}
                        aria-label="مسح البحث"
                    >
                        <X size={17} />
                    </button>
                )}
            </label>

            {error && (
                <div className="admin-dashboard__error" role="alert">
                    <AlertCircle size={19} />
                    <span>{error}</span>
                    <button type="button" onClick={handleRefresh}>إعادة المحاولة</button>
                </div>
            )}

            {isLoading ? (
                <div className="admin-dashboard__state" role="status">
                    <RefreshCw className="admin-dashboard__state-spinner" size={25} />
                    <strong>جارٍ تحميل الملفات...</strong>
                </div>
            ) : filteredFiles.length > 0 ? (
                <div className="admin-dashboard__grid">
                    {filteredFiles.map((file) => {
                        const departments = getFileDepartments(file);

                        return (
                            <article className="admin-file-card" key={file._id}>
                                <div className="admin-file-card__top">
                                    <span className="admin-file-card__icon">
                                        <FileText size={23} />
                                    </span>
                                    <span className="admin-file-card__department">
                                        <Building2 size={14} />
                                        {departments.length > 0 ? departments.join('، ') : 'عام'}
                                    </span>
                                </div>

                                <div className="admin-file-card__details">
                                    <h3 dir="auto" title={file.originalName}>
                                        {file.originalName}
                                    </h3>

                                    <p className="admin-file-card__meta">
                                        <UserRound size={15} />
                                        <span>{file.uploadedBy?.name || 'غير معروف'}</span>
                                    </p>

                                    <p className="admin-file-card__meta">
                                        <CalendarDays size={15} />
                                        <span>
                                            {new Date(file.createdAt).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </p>

                                    <p className="admin-file-card__meta">
                                        <UsersRound size={15} />
                                        <span>
                                            {file.accessMode === 'users'
                                                ? `مشاركة مع ${file.sharedWith?.length || 0} حساب`
                                                : 'متاح للأقسام المحددة بالكامل'}
                                        </span>
                                    </p>
                                </div>

                                <div className="admin-file-card__actions">
                                    <button
                                        className="admin-file-card__action admin-file-card__action--edit"
                                        type="button"
                                        onClick={() => openEditModal(file)}
                                    >
                                        <Pencil size={16} />
                                        <span>تعديل</span>
                                    </button>

                                    <button
                                        className="admin-file-card__action admin-file-card__action--download"
                                        type="button"
                                        onClick={() => handleDownload(file)}
                                    >
                                        <Download size={16} />
                                        <span>تنزيل</span>
                                    </button>

                                    <button
                                        className="admin-file-card__action admin-file-card__action--delete"
                                        type="button"
                                        onClick={() => handleDelete(file)}
                                        disabled={deletingFileId === file._id}
                                        aria-label={`حذف ${file.originalName}`}
                                    >
                                        <Trash2 size={16} />
                                        <span>{deletingFileId === file._id ? 'جارٍ الحذف' : 'حذف'}</span>
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : error ? null : (
                <div className="admin-dashboard__empty">
                    <span className="admin-dashboard__empty-icon">
                        {searchTerm ? <Search size={27} /> : <FolderOpen size={27} />}
                    </span>
                    <h3>{searchTerm ? 'لا توجد نتائج مطابقة' : 'لا توجد ملفات بعد'}</h3>
                    <p>
                        {searchTerm
                            ? 'جرّب البحث بكلمات مختلفة أو امسح البحث لعرض جميع الملفات.'
                            : 'ارفع أول ملف لتبدأ بتنظيم ملفات المؤسسة هنا.'}
                    </p>

                    {searchTerm ? (
                        <button
                            className="admin-dashboard__empty-button admin-dashboard__empty-button--secondary"
                            type="button"
                            onClick={() => setSearchTerm('')}
                        >
                            مسح البحث
                        </button>
                    ) : (
                        <Link className="admin-dashboard__empty-button" to="/admin/upload">
                            <Upload size={17} />
                            رفع ملف جديد
                        </Link>
                    )}
                </div>
            )}

            {editingFile && (
                <div className="admin-access-modal" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeEditModal();
                }}>
                    <section
                        className="admin-access-modal__panel"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-access-modal-title"
                        dir="rtl"
                    >
                        <header className="admin-access-modal__header">
                            <div>
                                <span>إدارة صلاحيات الملف</span>
                                <h2 id="admin-access-modal-title" dir="auto">{editingFile.originalName}</h2>
                            </div>
                            <button
                                className="admin-access-modal__close"
                                type="button"
                                onClick={closeEditModal}
                                disabled={isSavingAccess}
                                aria-label="إغلاق"
                            >
                                <X size={19} />
                            </button>
                        </header>

                        {editError && (
                            <div className="admin-access-modal__error" role="alert">
                                <AlertCircle size={17} />
                                <span>{editError}</span>
                            </div>
                        )}

                        <form onSubmit={handleAccessSave}>
                            <fieldset className="admin-access-modal__field">
                                <legend>الأقسام</legend>
                                <div className="admin-access-modal__departments">
                                    {departments.map((department) => (
                                        <label
                                            className={`admin-access-modal__department${editDepartments.includes(department) ? ' is-selected' : ''}`}
                                            key={department}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={editDepartments.includes(department)}
                                                onChange={() => toggleEditDepartment(department)}
                                            />
                                            <Building2 size={16} />
                                            <span>{department}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <fieldset className="admin-access-modal__field">
                                <legend>من يمكنه مشاهدة الملف؟</legend>
                                <div className="admin-access-modal__modes">
                                    <label className={`admin-access-modal__mode${editAccessMode === 'department' ? ' is-selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="editAccessMode"
                                            checked={editAccessMode === 'department'}
                                            onChange={() => {
                                                setEditAccessMode('department');
                                                setIsLoadingEditUsers(false);
                                                setEditError('');
                                            }}
                                        />
                                        <UsersRound size={18} />
                                        <span>كل موظفي الأقسام المحددة</span>
                                    </label>
                                    <label className={`admin-access-modal__mode${editAccessMode === 'users' ? ' is-selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="editAccessMode"
                                            checked={editAccessMode === 'users'}
                                            onChange={() => {
                                                setEditAccessMode('users');
                                                setEditDepartmentUsers([]);
                                                setIsLoadingEditUsers(editDepartments.length > 0);
                                                setEditError('');
                                            }}
                                        />
                                        <UserRound size={18} />
                                        <span>حسابات محددة</span>
                                    </label>
                                </div>
                            </fieldset>

                            {editAccessMode === 'users' && (
                                <div className="admin-access-modal__users">
                                    <div className="admin-access-modal__users-heading">
                                        <strong>حسابات الأقسام المحددة</strong>
                                        <span>تم اختيار {editSelectedUserIds.length}</span>
                                    </div>
                                    {editDepartmentUsers.length > 0 && (
                                        <label className="admin-access-modal__search">
                                            <Search size={16} />
                                            <input
                                                type="search"
                                                value={editUserSearch}
                                                onChange={(event) => setEditUserSearch(event.target.value)}
                                                placeholder="ابحث بالاسم أو اسم المستخدم..."
                                                aria-label="البحث في الحسابات"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setEditSelectedUserIds((current) => [
                                                    ...new Set([
                                                        ...current,
                                                        ...filteredEditUsers.map((account) => String(account._id)),
                                                    ]),
                                                ])}
                                            >
                                                تحديد الظاهر
                                            </button>
                                        </label>
                                    )}
                                    {isLoadingEditUsers ? (
                                        <div className="admin-access-modal__users-state">
                                            <LoaderCircle className="admin-dashboard__state-spinner" size={18} />
                                            جارٍ تحميل الحسابات...
                                        </div>
                                    ) : filteredEditUsers.length > 0 ? (
                                        <div className="admin-access-modal__user-list">
                                            {filteredEditUsers.map((account) => (
                                                <label
                                                    className="admin-access-modal__user"
                                                    key={account._id}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={editSelectedUserIds.includes(String(account._id))}
                                                        onChange={() => toggleEditUser(account._id)}
                                                    />
                                                    <span>
                                                        <strong>{account.name}</strong>
                                                        <small>{account.username} · {account.department}</small>
                                                    </span>
                                                    <Check size={16} />
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="admin-access-modal__users-state">
                                            {editDepartmentUsers.length
                                                ? 'لا توجد حسابات تطابق البحث.'
                                                : editDepartments.length
                                                    ? 'لا توجد حسابات في الأقسام المحددة.'
                                                    : 'اختر قسماً لعرض حساباته.'}
                                        </div>
                                    )}
                                </div>
                            )}

                            <footer className="admin-access-modal__actions">
                                <button type="button" onClick={closeEditModal} disabled={isSavingAccess}>
                                    إلغاء
                                </button>
                                <button type="submit" disabled={isSavingAccess}>
                                    {isSavingAccess ? (
                                        <>
                                            <LoaderCircle className="admin-dashboard__state-spinner" size={17} />
                                            جارٍ الحفظ...
                                        </>
                                    ) : 'حفظ التغييرات'}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
            <ActionAlert
                alert={actionAlert}
                onClose={() => setActionAlert(null)}
                onConfirm={actionAlert?.onConfirm}
                isBusy={Boolean(deletingFileId)}
            />
        </section>
    );
};

export default AdminDashboard;