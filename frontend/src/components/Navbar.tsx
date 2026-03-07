import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0ea5e9] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">
              Somerset Mirissa
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <Link
              to="/rooms"
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
            >
              Rooms
            </Link>

            {isAuthenticated && !isAdmin && (
              <Link
                to="/my-bookings"
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
              >
                My Bookings
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
              >
                Admin
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-slate-500 hidden sm:block">{user?.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
