import API from '../api/axios';

export const previewFile = async (fileId) => {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
        throw new Error('اسمح بفتح النوافذ المنبثقة لعرض الملف.');
    }

    try {
        const response = await API.get(`/files/view/${fileId}`, { responseType: 'blob' });
        const fileUrl = URL.createObjectURL(response.data);
        previewWindow.location.href = fileUrl;
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } catch (error) {
        previewWindow.close();
        throw error;
    }
};

export const downloadFile = async (fileId, fileName) => {
    const response = await API.get(`/files/download/${fileId}`, { responseType: 'blob' });
    const fileUrl = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
};
