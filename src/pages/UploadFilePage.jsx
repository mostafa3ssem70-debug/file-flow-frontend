import { useContext, useEffect, useRef, useState } from 'react';
import {
    Check,
    File,
    FileText,
    FolderOpen,
    LoaderCircle,
    Search,
    Upload,
    UserRound,
    UsersRound,
    X,
} from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import ActionAlert from '../components/ActionAlert';
import './UploadFilePage.css';

const UploadFilePage = () => {
    const { user } = useContext(AuthContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedDepartments, setSelectedDepartments] = useState([
        user?.department || 'Engineering',
    ]);
    const [accessMode, setAccessMode] = useState('department');
    const [departmentUsers, setDepartmentUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const isAdmin = user?.role === 'admin';
    const departments = ['Engineering', 'Management', 'HR', 'General'];

    useEffect(() => {
        if (accessMode !== 'users') return undefined;

        if (selectedDepartments.length === 0) return undefined;

        let isActive = true;
        Promise.all(selectedDepartments.map(async (department) => {
            const response = await API.get('/auth/department-users', {
                params: { department },
            });
            return response.data.map((account) => ({ ...account, department }));
        }))
            .then((usersByDepartment) => {
                if (isActive) setDepartmentUsers(usersByDepartment.flat());
            })
            .catch((error) => {
                if (isActive) {
                    setUsersError(error.response?.data?.message || 'تعذر تحميل حسابات القسم.');
                }
            })
            .finally(() => {
                if (isActive) setIsLoadingUsers(false);
            });

        return () => {
            isActive = false;
        };
    }, [accessMode, selectedDepartments]);

    const selectFile = (file) => {
        if (!file) return;
        setSelectedFile(file);
        setFeedback(null);
    };

    const handleFileChange = (event) => {
        selectFile(event.target.files?.[0]);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        selectFile(event.dataTransfer.files?.[0]);
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setFeedback(null);
    };

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!selectedFile) {
            setFeedback({ type: 'error', text: 'يرجى اختيار ملف أولاً' });
            return;
        }

        if (selectedDepartments.length === 0) {
            setFeedback({ type: 'error', text: 'يرجى اختيار قسم واحد على الأقل' });
            return;
        }

        if (accessMode === 'users' && selectedUserIds.length === 0) {
            setFeedback({ type: 'error', text: 'اختر حساباً واحداً على الأقل لعرض الملف' });
            return;
        }

        const uploadDepartments = accessMode === 'users'
            ? selectedDepartments.filter((department) => departmentUsers.some((account) => (
                account.department === department && selectedUserIds.includes(account._id)
            )))
            : selectedDepartments;

        if (uploadDepartments.length === 0) {
            setFeedback({
                type: 'error',
                text: 'لم يتم العثور على قسم مرتبط بالحسابات المحددة. أعد تحديد الحسابات.',
            });
            return;
        }

        const departmentUserIds = departmentUsers
            .filter((account) => uploadDepartments.includes(account.department))
            .map((account) => account._id);

        const sharedWith = accessMode === 'users'
            ? selectedUserIds.filter((userId) => departmentUserIds.includes(userId))
            : [];

        setIsUploading(true);
        setFeedback(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('departments', JSON.stringify(uploadDepartments));
            formData.append('accessMode', accessMode);
            formData.append('sharedWith', JSON.stringify(sharedWith));

            await API.post('/files/upload', formData);

            setFeedback({ type: 'success', text: 'تم رفع الملف بنجاح' });
            setSelectedFile(null);
            setSelectedUserIds([]);
            setAccessMode('department');

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setFeedback({
                type: 'error',
                text: err.response?.data?.message || 'فشل رفع الملف',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (size) => {
        if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const filteredDepartmentUsers = departmentUsers.filter((account) => (
        `${account.name} ${account.username}`.toLocaleLowerCase()
            .includes(userSearch.trim().toLocaleLowerCase())
    ));

    const toggleUser = (userId) => {
        setSelectedUserIds((current) => (
            current.includes(userId)
                ? current.filter((id) => id !== userId)
                : [...current, userId]
        ));
    };

    const selectAllVisibleUsers = () => {
        setSelectedUserIds((current) => [
            ...new Set([...current, ...filteredDepartmentUsers.map((account) => account._id)]),
        ]);
    };

    const clearSelectedUsers = () => setSelectedUserIds([]);

    const toggleDepartment = (department) => {
        const nextDepartments = selectedDepartments.includes(department)
            ? selectedDepartments.filter((item) => item !== department)
            : [...selectedDepartments, department];
        setSelectedDepartments(nextDepartments);
        setSelectedUserIds([]);
        setDepartmentUsers([]);
        setUsersError('');
        setUserSearch('');
        if (accessMode === 'users') setIsLoadingUsers(nextDepartments.length > 0);
    };

    const handleAccessModeChange = (mode) => {
        setAccessMode(mode);
        if (mode === 'users') {
            setIsLoadingUsers(true);
            setUsersError('');
            setDepartmentUsers([]);
            setSelectedUserIds([]);
        } else {
            setIsLoadingUsers(false);
        }
    };

    return (
        <main className="upload-page" dir="rtl">
            <section className="upload-card" aria-labelledby="upload-title">
                <header className="upload-header">
                    <div className="upload-header-icon" aria-hidden="true">
                        <Upload size={23} strokeWidth={2.2} />
                    </div>
                    <div>

                        <h1 id="upload-title">رفع ملف جديد</h1>
                        <p>أضف ملفك إلى القسم أو الأقسام المناسبة بخطوات بسيطة.</p>
                    </div>
                </header>

                <form className="upload-form" onSubmit={handleUpload}>
                    <div className="upload-field">
                        <span className="upload-label">القسم</span>
                        <div className="upload-department-options" role="group" aria-label="اختيار الأقسام">
                            {departments.map((department) => (
                                <label
                                    className={`upload-department-option${isAdmin ? ' is-editable' : ''}${selectedDepartments.includes(department) ? ' is-selected' : ''}`}
                                    key={department}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDepartments.includes(department)}
                                        disabled={!isAdmin}
                                        onChange={() => toggleDepartment(department)}
                                    />
                                    <FolderOpen size={17} aria-hidden="true" />
                                    <span>{department}</span>
                                </label>
                            ))}
                        </div>
                        <span className="upload-field-hint">
                            {isAdmin
                                ? 'يمكنك اختيار قسم واحد أو أكثر ليظهر الملف فيها.'
                                : 'القسم الذي ينبغي أن يظهر فيه الملف.'}
                        </span>
                    </div>

                    <fieldset className="upload-field upload-access-field">
                        <legend className="upload-label">من يمكنه مشاهدة الملف؟</legend>
                        <div className="upload-access-options">
                            <label className={`upload-access-option${accessMode === 'department' ? ' is-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="accessMode"
                                    value="department"
                                    checked={accessMode === 'department'}
                                    onChange={() => handleAccessModeChange('department')}
                                />
                                <span className="upload-access-option-icon">
                                    <UsersRound size={19} />
                                </span>
                                <span className="upload-access-option-copy">
                                    <strong>القسم بالكامل</strong>
                                    <span>
                                        {selectedDepartments.length > 1
                                            ? 'كل موظفي الأقسام المحددة'
                                            : `كل موظفي قسم ${selectedDepartments[0] || ''}`}
                                    </span>
                                </span>
                                <span className="upload-access-radio" aria-hidden="true" />
                            </label>

                            <label className={`upload-access-option${accessMode === 'users' ? ' is-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="accessMode"
                                    value="users"
                                    checked={accessMode === 'users'}
                                    onChange={() => handleAccessModeChange('users')}
                                />
                                <span className="upload-access-option-icon upload-access-option-icon--users">
                                    <UserRound size={19} />
                                </span>
                                <span className="upload-access-option-copy">
                                    <strong>حسابات محددة</strong>
                                    <span>اختر موظفاً أو أكثر من الأقسام المحددة</span>
                                </span>
                                <span className="upload-access-radio" aria-hidden="true" />
                            </label>
                        </div>

                        {accessMode === 'users' && (
                            <div className="upload-account-picker">
                                <div className="upload-account-picker-heading">
                                    <span>
                                        حسابات الأقسام المحددة
                                        <small>
                                            {selectedUserIds.length
                                                ? `تم اختيار ${selectedUserIds.length}`
                                                : 'اختر الحسابات المسموح لها'}
                                        </small>
                                    </span>
                                    {departmentUsers.length > 0 && (
                                        <div className="upload-account-picker-actions">
                                            <button type="button" onClick={selectAllVisibleUsers}>تحديد الظاهر</button>
                                            <button type="button" onClick={clearSelectedUsers}>مسح التحديد</button>
                                        </div>
                                    )}
                                </div>

                                {departmentUsers.length > 0 && (
                                    <label className="upload-account-search">
                                        <Search size={17} aria-hidden="true" />
                                        <input
                                            type="search"
                                            value={userSearch}
                                            onChange={(event) => setUserSearch(event.target.value)}
                                            placeholder="ابحث بالاسم أو اسم المستخدم..."
                                            aria-label="البحث في حسابات القسم"
                                        />
                                    </label>
                                )}

                                {isLoadingUsers ? (
                                    <div className="upload-account-state">
                                        <LoaderCircle className="upload-spinner" size={19} />
                                        جارٍ تحميل الحسابات...
                                    </div>
                                ) : usersError ? (
                                    <div className="upload-account-state upload-account-state--error" role="alert">
                                        {usersError}
                                    </div>
                                ) : filteredDepartmentUsers.length > 0 ? (
                                    <div className="upload-account-list">
                                        {filteredDepartmentUsers.map((account) => (
                                            <label
                                                className={`upload-account-option${selectedUserIds.includes(account._id) ? ' is-selected' : ''}`}
                                                key={account._id}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(account._id)}
                                                    onChange={() => toggleUser(account._id)}
                                                />
                                                <span className="upload-account-avatar">
                                                    {account.name?.trim()?.charAt(0) || <UserRound size={17} />}
                                                </span>
                                                <span className="upload-account-details">
                                                    <strong>{account.name}</strong>
                                                    <small dir="auto">
                                                        {account.username} · {account.department}
                                                    </small>
                                                </span>
                                                <Check className="upload-account-check" size={17} />
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="upload-account-state">
                                        {departmentUsers.length
                                            ? 'لا توجد حسابات تطابق البحث.'
                                            : 'لا توجد حسابات موظفين في هذا القسم.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </fieldset>

                    <div className="upload-field">
                        <span className="upload-label">الملف</span>
                        <input
                            ref={fileInputRef}
                            id="upload-file"
                            className="upload-file-input"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label
                            className={`upload-dropzone${isDragging ? ' is-dragging' : ''}${selectedFile ? ' has-file' : ''}`}
                            htmlFor="upload-file"
                            onDragEnter={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDragLeave={(event) => {
                                if (!event.currentTarget.contains(event.relatedTarget)) {
                                    setIsDragging(false);
                                }
                            }}
                            onDrop={handleDrop}
                        >
                            {selectedFile ? (
                                <>
                                    <span className="upload-drop-icon upload-drop-icon--file">
                                        <FileText size={23} aria-hidden="true" />
                                    </span>
                                    <span className="upload-drop-copy">
                                        <strong className="upload-file-name" dir="auto">{selectedFile.name}</strong>
                                        <span>{formatFileSize(selectedFile.size)} · جاهز للرفع</span>
                                    </span>
                                    <button
                                        className="upload-remove-file"
                                        type="button"
                                        aria-label="إزالة الملف المحدد"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            removeFile();
                                        }}
                                    >
                                        <X size={18} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="upload-drop-icon">
                                        <File size={23} aria-hidden="true" />
                                    </span>
                                    <span className="upload-drop-copy">
                                        <strong>اسحب الملف وأفلته هنا</strong>
                                        <span>أو <span className="upload-browse">تصفح الملفات</span> من جهازك</span>
                                    </span>
                                    <span className="upload-drop-arrow" aria-hidden="true">
                                        <Upload size={18} />
                                    </span>
                                </>
                            )}
                        </label>
                        <span className="upload-field-hint">
                            يمكنك اختيار أي نوع ملف من جهازك.
                        </span>
                    </div>

                    <button className="upload-submit" type="submit" disabled={isUploading}>
                        {isUploading ? (
                            <>
                                <LoaderCircle className="upload-spinner" size={19} />
                                جارٍ رفع الملف...
                            </>
                        ) : (
                            <>
                                <Upload size={19} />
                                رفع الملف
                            </>
                        )}
                    </button>
                </form>

                <footer className="upload-footer">
                    <span className="upload-footer-dot" aria-hidden="true" />
                    {selectedDepartments.length === 0
                        ? 'يرجى اختيار قسم واحد على الأقل'
                        : accessMode === 'department'
                            ? `سيكون الملف متاحاً لجميع موظفي ${selectedDepartments.length > 1 ? 'الأقسام' : 'قسم'} ${selectedDepartments.join('، ')}`
                            : `سيكون الملف متاحاً لـ ${selectedUserIds.length} حساب محدد`}
                </footer>
            </section>
            <ActionAlert
                alert={feedback && {
                    type: feedback.type,
                    title: feedback.type === 'success' ? 'تم رفع الملف' : 'تعذر رفع الملف',
                    message: feedback.text,
                }}
                onClose={() => setFeedback(null)}
            />
        </main>
    );
};

export default UploadFilePage;
