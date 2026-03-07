import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bookingsApi } from "@/services/api";
import { formatLKR, formatDate } from "@/lib/utils";

export default function ConfirmationPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .myBookings()
      .then((res) => {
        const found = res.data.find((b: any) => String(b.id) === bookingId);
        setBooking(found || null);
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-slate-500">Booking not found.</p>
          <Button className="mt-4" asChild>
            <Link to="/my-bookings">My Bookings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
        <p className="text-slate-500 mb-8">
          Thank you for choosing Somerset Mirissa Beach Hotel. We look forward to welcoming you.
        </p>

        <Card className="text-left mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Reservation Details</CardTitle>
              <Badge variant="success">Confirmed</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Confirmation Code</span>
              <span className="font-mono font-bold text-lg text-[#0ea5e9]">
                {booking.confirmation_code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Check-in</span>
              <span className="font-medium">{formatDate(booking.check_in)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Check-out</span>
              <span className="font-medium">{formatDate(booking.check_out)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Guests</span>
              <span className="font-medium">{booking.guests}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-[#0ea5e9]">
                {formatLKR(booking.total_price)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 text-left mb-6">
          <p className="font-semibold mb-1">Important</p>
          <p>Check-in: 2:00 PM · Check-out: 11:00 AM</p>
          <p>Please present this confirmation code at reception.</p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/my-bookings">View My Bookings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
