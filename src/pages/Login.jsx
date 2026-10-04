import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Eye,
    EyeOff,
    FolderKanban,
    LoaderCircle,
    LockKeyhole,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = window.setTimeout(() => setShowSplash(false), 1400);
        return () => window.clearTimeout(timer);
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        setError('');
        setIsSubmitting(true);
        try {
            const user = await login(username.trim(), password);
            navigate(user.role === 'admin' ? '/admin' : '/employee');
        } catch (loginError) {
            setError(loginError.response?.data?.message || 'فشل تسجيل الدخول، تحقق من اسم المستخدم وكلمة المرور.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSplash) {
        return (
            <main className="login-splash" dir="rtl">
                <div className="login-splash__orb login-splash__orb--one" />
                <div className="login-splash__orb login-splash__orb--two" />
                <div className="login-splash__content">
                    <span className="login-splash__icon">
                        <FolderKanban size={42} />
                    </span>
                    <h1>File Flow</h1>
                    <p>نظام إدارة الملفات</p>
                    <span className="login-splash__loader" aria-label="جارٍ التحميل" />
                </div>
            </main>
        );
    }

    return (
        <main className="login-page" dir="rtl">
            <div className="login-page__glow login-page__glow--top" />
            <div className="login-page__glow login-page__glow--bottom" />

            <section className="login-card" aria-label="تسجيل الدخول">
                <header className="login-card__brand">
                    <span className="login-card__brand-icon">
                        <FolderKanban size={22} />
                    </span>
                    <span>File Flow</span>
                </header>

                <div className="login-heading">
                    <h1>تسجيل الدخول</h1>
                    <p>أدخل بيانات حسابك للمتابعة إلى مساحة العمل.</p>
                </div>

                {error && (
                    <div className="login-error" role="alert">
                        <span className="login-error__mark">!</span>
                        <span>{error}</span>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="login-username">اسم المستخدم</label>
                        <div className="login-input-wrap">
                            <UserRound size={18} aria-hidden="true" />
                            <input
                                id="login-username"
                                type="text"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    if (error) setError('');
                                }}
                                autoComplete="username"
                                autoCapitalize="none"
                                dir="auto"
                                required
                                placeholder="أدخل اسم المستخدم"
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label htmlFor="login-password">كلمة المرور</label>
                        <div className="login-input-wrap">
                            <LockKeyhole size={18} aria-hidden="true" />
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    if (error) setError('');
                                }}
                                autoComplete="current-password"
                                required
                                placeholder="أدخل كلمة المرور"
                            />
                            <button
                                className="login-password-toggle"
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button className="login-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <LoaderCircle className="login-submit__spinner" size={19} />
                                جارٍ تسجيل الدخول...
                            </>
                        ) : (
                            <>
                                تسجيل الدخول
                                <ArrowLeft size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-secure-note">
                    <ShieldCheck size={15} />
                    <span>اتصال آمن ومخصص لمستخدمي النظام</span>
                </div>
            </section>
            <p className="login-page__copyright">File Flow <span>·</span> نظام إدارة الملفات</p>
        </main>
    );
};

export default Login;
