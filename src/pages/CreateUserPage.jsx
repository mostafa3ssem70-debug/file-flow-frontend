import { useState, useEffect } from 'react';
import { Plus, Users, ShieldCheck, BriefcaseBusiness, UserRound, X, Pencil, Trash2 } from 'lucide-react';
import API from '../api/axios';
import ActionAlert from '../components/ActionAlert';

const defaultForm = {
    name: '',
    username: '',
    password: '',
    role: 'employee',
    department: 'Engineering',
};

const CreateUserPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState(defaultForm);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deletingAccountId, setDeletingAccountId] = useState(null);
    const [actionAlert, setActionAlert] = useState(null);

    const fetchAccounts = async () => {
        const localData = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

        try {
            const res = await API.get('/auth/users');
            const data = Array.isArray(res.data) ? res.data : res.data?.users || res.data?.data || [];
            const finalUsers = data.length > 0 ? data : localData;

            setAccounts(finalUsers);
            if (finalUsers.length > 0) {
                localStorage.setItem('registeredUsers', JSON.stringify(finalUsers));
            }
        } catch (err) {
            setAccounts(localData);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setEditTargetId(null);
        setForm(defaultForm);
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditTargetId(user._id || user.username);
        setForm({
            name: user.name || '',
            username: user.username || '',
            password: '',
            role: user.role || 'employee',
            department: user.department || 'Engineering',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editTargetId) {
                await API.put(`/auth/users/${editTargetId}`, form);
            } else {
                await API.post('/auth/register', form);
            }

            setForm(defaultForm);
            setEditTargetId(null);
            setIsModalOpen(false);
            await fetchAccounts();
            setActionAlert({
                type: 'success',
                title: editTargetId ? 'تم تعديل الحساب' : 'تم إنشاء الحساب',
                message: editTargetId
                    ? 'تم حفظ التغييرات على بيانات الحساب بنجاح.'
                    : 'تمت إضافة الحساب الجديد بنجاح.',
            });
        } catch (err) {
            setActionAlert({
                type: 'error',
                title: editTargetId ? 'تعذر تعديل الحساب' : 'تعذر إنشاء الحساب',
                message: err.response?.data?.message || 'حدث خطأ أثناء حفظ الحساب. تحقق من الاتصال ثم حاول مرة أخرى.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        const targetId = String(id);
        const account = accounts.find((user) => String(user._id || user.username) === targetId);
        setActionAlert({
            type: 'confirm',
            title: 'تأكيد حذف الحساب',
            message: `هل أنت متأكد من حذف حساب ${account?.name || account?.username || ''}؟ لا يمكن التراجع عن هذا الإجراء.`,
            confirmLabel: 'حذف الحساب',
            onConfirm: () => confirmDeleteAccount(targetId),
        });
    };

    const confirmDeleteAccount = async (targetId) => {
        setActionAlert(null);
        setDeletingAccountId(targetId);
        try {
            await API.delete(`/auth/users/${targetId}`);
            const nextAccounts = accounts.filter((user) => String(user._id || user.username) !== targetId);
            setAccounts(nextAccounts);
            localStorage.setItem('registeredUsers', JSON.stringify(nextAccounts));
            setActionAlert({
                type: 'success',
                title: 'تم حذف الحساب',
                message: 'تم حذف الحساب بنجاح.',
            });
        } catch (err) {
            setActionAlert({
                type: 'error',
                title: 'تعذر حذف الحساب',
                message: err.response?.data?.message || 'حدث خطأ أثناء حذف الحساب. حاول مرة أخرى.',
            });
        } finally {
            setDeletingAccountId(null);
        }
    };

    const adminCount = accounts.filter((user) => user.role === 'admin').length;
    const employeeCount = accounts.filter((user) => user.role === 'employee').length;

    return (
        <div className="create-user-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <p className="create-user-page__eyebrow" style={{ margin: 0, color: '#6366f1', fontWeight: '700', fontSize: '13px' }}>إدارة الحسابات</p>
                    <h2 className="create-user-page__title" style={{ margin: '8px 0 0', fontSize: '32px', color: '#0f172a' }}>الحسابات</h2>
                </div>

                <button
                    onClick={openCreateModal}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                        color: '#fff',
                        borderRadius: '14px',
                        padding: '12px 18px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        boxShadow: '0 12px 20px rgba(79, 70, 229, 0.28)',
                    }}
                >
                    <Plus size={18} />
                    إضافة حساب
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <StatCard icon={<Users size={22} />} label="إجمالي الحسابات" value={accounts.length} color="#2563eb" />
                <StatCard icon={<ShieldCheck size={22} />} label="المشرفين" value={adminCount} color="#16a34a" />
                <StatCard icon={<BriefcaseBusiness size={22} />} label="الموظفين" value={employeeCount} color="#f59e0b" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                {accounts.length > 0 ? (
                    accounts.map((user) => (
                        <div key={user._id || user.username} style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px rgba(15,23,42,0.05)', padding: '18px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: user.role === 'admin' ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#0f172a' }}>
                                    <UserRound size={24} />
                                </div>
                                <span style={{
                                    background: user.role === 'admin' ? '#dcfce7' : '#dbeafe',
                                    color: user.role === 'admin' ? '#166534' : '#1d4ed8',
                                    padding: '6px 10px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                }}>
                                    {user.role === 'admin' ? 'مدير' : 'موظف'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <p className="create-user-page__detail-label" style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>الاسم</p>
                                    <h3 style={{ margin: '6px 0 0', fontSize: '20px', color: '#0f172a' }}>{user.name}</h3>
                                </div>

                                <DetailRow label="اسم المستخدم" value={user.username} />
                                <DetailRow label="القسم" value={user.department} />
                                <DetailRow label="الدور" value={user.role === 'admin' ? 'Admin' : 'Employee'} />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                <button
                                    onClick={() => openEditModal(user)}
                                    className="create-user-page__edit-button"
                                    style={{ flex: 1, border: 'none', borderRadius: '10px', background: '#e0f2fe', color: '#0f172a', fontWeight: '700', cursor: 'pointer', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    type="button"
                                >
                                    <Pencil size={15} />
                                    تعديل
                                </button>
                                <button
                                    onClick={() => handleDelete(user._id || user.username)}
                                    disabled={deletingAccountId === String(user._id || user.username)}
                                    className="create-user-page__delete-button"
                                    style={{ flex: 1, border: 'none', borderRadius: '10px', background: '#fee2e2', color: '#991b1b', fontWeight: '700', cursor: 'pointer', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    type="button"
                                >
                                    <Trash2 size={15} />
                                    {deletingAccountId === String(user._id || user.username) ? 'جارٍ الحذف...' : 'حذف'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="create-user-page__empty" style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: '18px', border: '1px dashed #cbd5e1', padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        لا توجد حسابات مضافة بعد.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
                    <div className="create-user-page__modal" style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '20px', boxShadow: '0 25px 50px rgba(15,23,42,0.25)', padding: '24px', position: 'relative' }}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="create-user-page__modal-close"
                            style={{ position: 'absolute', top: '16px', left: '16px', width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            type="button"
                        >
                            <X size={18} />
                        </button>

                        <h3 style={{ margin: '0 0 20px', fontSize: '26px', color: '#0f172a' }}>{editTargetId ? 'تعديل الحساب' : 'إضافة حساب جديد'}</h3>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <InputField label="الاسم" name="name" value={form.name} onChange={handleChange} />
                            <InputField label="اسم المستخدم" name="username" value={form.username} onChange={handleChange} />
                            <InputField label={editTargetId ? 'كلمة المرور (اختيارية)' : 'كلمة المرور'} name="password" type="password" value={form.password} onChange={handleChange} required={!editTargetId} />

                            <div>
                                <label className="create-user-page__field-label" style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '700' }}>الدور</label>
                                <select name="role" value={form.role} onChange={handleChange} style={fieldStyle}>
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="create-user-page__field-label" style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '700' }}>القسم</label>
                                <select name="department" value={form.department} onChange={handleChange} style={fieldStyle}>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Management">Management</option>
                                    <option value="HR">HR</option>
                                    <option value="General">General</option>
                                </select>
                            </div>

                            <button type="submit" disabled={loading} style={{ marginTop: '8px', padding: '12px 16px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                                {loading ? (editTargetId ? 'جاري التعديل...' : 'جاري الإنشاء...') : (editTargetId ? 'تعديل الحساب' : 'إنشاء الحساب')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <ActionAlert
                alert={actionAlert}
                onClose={() => setActionAlert(null)}
                onConfirm={actionAlert?.onConfirm}
                isBusy={Boolean(deletingAccountId)}
            />
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px rgba(15,23,42,0.05)', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: color, opacity: 0.12, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
        </div>
        <div>
            <div className="create-user-page__stat-label" style={{ fontSize: '12px', color: '#64748b' }}>{label}</div>
            <div className="create-user-page__stat-value" style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{value}</div>
        </div>
    </div>
);

const DetailRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
        <span className="create-user-page__detail-label" style={{ color: '#64748b', fontSize: '12px' }}>{label}</span>
        <span className="create-user-page__detail-value" style={{ color: '#0f172a', fontSize: '13px', fontWeight: '700', textAlign: 'left' }}>{value}</span>
    </div>
);

const InputField = ({ label, name, value, onChange, type = 'text', required = true }) => (
    <div>
        <label className="create-user-page__field-label" style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '700' }}>{label}</label>
        <input
            name={name}
            value={value}
            onChange={onChange}
            type={type}
            style={fieldStyle}
            required={required}
        />
    </div>
);

const fieldStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
};

export default CreateUserPage;
