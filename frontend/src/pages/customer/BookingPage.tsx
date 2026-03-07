import { useState, useEffect, type FormEvent } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roomsApi, bookingsApi } from "@/services/api";
import { formatLKR, nightsBetween } from "@/lib/utils";

export default function BookingPage() {
  const { roomTypeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState(searchParams.get("check_in") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") || "");
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (roomTypeId) {
      roomsApi.detail(Number(roomTypeId)).then((res) => setRoom(res.data));
    }
  }, [roomTypeId]);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const totalPrice = room ? nights * room.price_per_night : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates.");
      return;
    }
    if (nights < 1) {
      setError("Check-out must be at least 1 night after check-in.");
      return;
    }
    if (guests < 1 || (room && guests > room.capacity)) {
      setError(`Guests must be between 1 and ${room?.capacity}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await bookingsApi.create({
        room_type_id: Number(roomTypeId),
        check_in: checkIn,
        check_out: checkOut,
        guests,
        notes: notes || undefined,
      });
      navigate(`/confirmation/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Check-in</Label>
                      <Input
                        type="date"
                        min={today}
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-out</Label>
                      <Input
                        type="date"
                        min={checkIn || today}
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of guests</Label>
                    <Input
                      type="number"
                      min={1}
                      max={room.capacity}
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      required
                    />
                    <p className="text-xs text-slate-400">Max {room.capacity} guests</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Special requests (optional)</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
                      placeholder="E.g. early check-in, extra towels..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Confirming…" : "Confirm Reservation"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{room.name} Room</p>
                  <p className="text-sm text-slate-500">{room.description?.slice(0, 80)}…</p>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-in</span>
                    <span className="font-medium">{checkIn || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-out</span>
                    <span className="font-medium">{checkOut || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nights</span>
                    <span className="font-medium">{nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guests</span>
                    <span className="font-medium">{guests}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-[#0ea5e9]">
                      {nights > 0 ? formatLKR(totalPrice) : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatLKR(room.price_per_night)}/night × {nights} night{nights !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                  Free cancellation before check-in. Reservation only — no payment required now.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
