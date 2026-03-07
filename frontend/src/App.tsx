import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Customer pages
import LandingPage from "@/pages/customer/LandingPage";
import RoomsPage from "@/pages/customer/RoomsPage";
import RoomDetailPage from "@/pages/customer/RoomDetailPage";
import BookingPage from "@/pages/customer/BookingPage";
import ConfirmationPage from "@/pages/customer/ConfirmationPage";
import MyBookingsPage from "@/pages/customer/MyBookingsPage";
import FeedbackPage from "@/pages/customer/FeedbackPage";
import LoginPage from "@/pages/customer/LoginPage";
import RegisterPage from "@/pages/customer/RegisterPage";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminRooms from "@/pages/admin/AdminRooms";
import AdminPredictions from "@/pages/admin/AdminPredictions";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminCustomers from "@/pages/admin/AdminCustomers";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer-protected */}
          <Route
            path="/book/:roomTypeId"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/confirmation/:bookingId"
            element={
              <ProtectedRoute>
                <ConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback/:bookingId"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />

          {/* Admin-protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute requireAdmin>
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute requireAdmin>
                <AdminRooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/predictions"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPredictions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requireAdmin>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCustomers />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
