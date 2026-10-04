import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import UploadFilePage from './pages/UploadFilePage';
import CreateUserPage from './pages/CreateUserPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        {/* صفحة تسجيل الدخول */}
        <Route path="/login" element={<Login />} />

        {/* صفحات الموظف بدون الشريط الجانبي */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['employee', 'admin']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* صفحة رفع الملفات للموظف بدون الشريط الجانبي */}
        <Route
          path="/employee/upload"
          element={
            <ProtectedRoute allowedRoles={['employee', 'admin']}>
              <UploadFilePage />
            </ProtectedRoute>
          }
        />

        {/* لوحة تحكم الأدمن مع الشريط الجانبي والمسارات الفرعية */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />

          <Route path="upload" element={<UploadFilePage />} />

          <Route
            path="create-user"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateUserPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* إعادة التوجيه الافتراضية عند طلب مسار غير موجود */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;