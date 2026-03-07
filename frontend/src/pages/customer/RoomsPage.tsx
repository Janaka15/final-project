import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { roomsApi } from "@/services/api";
import { formatLKR } from "@/lib/utils";

interface RoomType {
  id: number;
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
  total_rooms: number;
  amenities: string[];
  image_url: string;
  available_count?: number;
}

const ROOM_IMAGES: Record<string, string> = {
  Standard:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80",
  Deluxe:
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
  Suite:
    "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600&q=80",
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    roomsApi.list().then((res) => setRooms(res.data));
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const handleSearch = async () => {
    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await roomsApi.availability(checkIn, checkOut);
      setRooms(res.data);
      setSearched(true);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to check availability.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setCheckIn("");
    setCheckOut("");
    setSearched(false);
    setError("");
    const res = await roomsApi.list();
    setRooms(res.data);
  };

  const displayRooms = searched
    ? rooms.filter((r) => (r.available_count ?? r.total_rooms) > 0)
    : rooms;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Our Rooms</h1>
        <p className="text-slate-500 mb-8">
          {searched
            ? `Showing available rooms for ${checkIn} → ${checkOut}`
            : "Select dates to check availability"}
        </p>

        {/* Availability search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Check-in</Label>
                <Input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out</Label>
                <Input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} disabled={loading} className="flex-1">
                  {loading ? "Checking…" : "Check Availability"}
                </Button>
                {searched && (
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        {/* Room grid */}
        {displayRooms.length === 0 && searched ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">No rooms available</p>
            <p className="text-slate-500">Try different dates.</p>
            <Button className="mt-4" onClick={handleClear}>
              Show all rooms
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(searched ? displayRooms : rooms).map((room) => (
              <Card
                key={room.id}
                className="overflow-hidden group hover:shadow-lg transition-shadow"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={ROOM_IMAGES[room.name] || room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {searched && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="success">
                        {room.available_count} available
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-xl">{room.name}</h3>
                    <span className="text-sm font-semibold text-[#0ea5e9]">
                      {formatLKR(room.price_per_night)}
                      <span className="text-slate-400 font-normal">/night</span>
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">
                    Up to {room.capacity} guests
                  </p>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {room.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(room.amenities || []).slice(0, 3).map((a) => (
                      <Badge key={a} variant="secondary" className="text-xs">
                        {a}
                      </Badge>
                    ))}
                    {(room.amenities || []).length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{room.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/rooms/${room.id}`}>View Details</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      asChild
                      disabled={
                        searched && (room.available_count ?? room.total_rooms) === 0
                      }
                    >
                      <Link
                        to={
                          checkIn && checkOut
                            ? `/book/${room.id}?check_in=${checkIn}&check_out=${checkOut}`
                            : `/book/${room.id}`
                        }
                      >
                        Book Now
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
