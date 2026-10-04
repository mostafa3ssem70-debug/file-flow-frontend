import { useEffect, useRef } from 'react';
import { AlertTriangle, CircleCheck, CircleX, LoaderCircle, X } from 'lucide-react';
import './ActionAlert.css';

const alertIcons = {
    confirm: AlertTriangle,
    success: CircleCheck,
    error: CircleX,
};

const ActionAlert = ({
    alert,
    onClose,
    onConfirm,
    isBusy = false,
}) => {
    const closeButtonRef = useRef(null);

    useEffect(() => {
        if (!alert) return undefined;

        closeButtonRef.current?.focus();
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !isBusy) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        const timeoutId = alert.type === 'success' && !isBusy
            ? window.setTimeout(onClose, 1500)
            : null;

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (timeoutId !== null) window.clearTimeout(timeoutId);
        };
    }, [alert, isBusy, onClose]);

    if (!alert) return null;

    const Icon = alertIcons[alert.type] || CircleCheck;
    const isConfirm = alert.type === 'confirm';

    return (
        <div className="action-alert-backdrop">
            <section
                className={`action-alert action-alert--${alert.type || 'success'}`}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="action-alert-title"
                aria-describedby="action-alert-message"
                dir="rtl"
            >
                <button
                    ref={closeButtonRef}
                    className="action-alert__close"
                    type="button"
                    onClick={onClose}
                    disabled={isBusy}
                    aria-label="إغلاق التنبيه"
                >
                    <X size={18} />
                </button>
                <span className="action-alert__icon" aria-hidden="true">
                    <Icon size={27} />
                </span>
                <h2 id="action-alert-title">{alert.title}</h2>
                <p id="action-alert-message">{alert.message}</p>
                <div className="action-alert__actions">
                    {isConfirm && (
                        <button
                            className="action-alert__button action-alert__button--cancel"
                            type="button"
                            onClick={onClose}
                            disabled={isBusy}
                        >
                            إلغاء
                        </button>
                    )}
                    <button
                        className={`action-alert__button${isConfirm ? ' action-alert__button--confirm' : ''}`}
                        type="button"
                        onClick={isConfirm ? onConfirm : onClose}
                        disabled={isBusy}
                    >
                        {isBusy ? (
                            <>
                                <LoaderCircle className="action-alert__spinner" size={17} />
                                جارٍ التنفيذ...
                            </>
                        ) : isConfirm ? alert.confirmLabel || 'تأكيد' : 'حسنًا'}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default ActionAlert;
