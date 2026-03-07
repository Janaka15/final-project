import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { roomsApi } from "@/services/api";
import { formatLKR } from "@/lib/utils";
import { Users, Check } from "lucide-react";

const ROOM_IMAGES: Record<string, string[]> = {
  Standard: [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  ],
  Deluxe: [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
  ],
  Suite: [
    "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
  ],
};

export default function RoomDetailPage() {
  const { id } = useParams();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (id) {
      roomsApi
        .detail(Number(id))
        .then((res) => setRoom(res.data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-slate-500">Room not found.</p>
          <Button className="mt-4" asChild>
            <Link to="/rooms">Back to Rooms</Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = ROOM_IMAGES[room.name] || [room.image_url];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-[#0ea5e9]">Home</Link>
          {" / "}
          <Link to="/rooms" className="hover:text-[#0ea5e9]">Rooms</Link>
          {" / "}
          <span className="text-slate-900">{room.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Images */}
          <div className="lg:col-span-3">
            <div className="rounded-xl overflow-hidden h-72 sm:h-96 mb-3">
              <img
                src={images[imgIdx]}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`rounded-lg overflow-hidden h-16 w-24 border-2 transition-all ${
                      i === imgIdx ? "border-[#0ea5e9]" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{room.name} Room</h1>
            <p className="text-2xl font-semibold text-[#0ea5e9] mb-4">
              {formatLKR(room.price_per_night)}
              <span className="text-base font-normal text-slate-400"> / night</span>
            </p>

            <p className="text-slate-600 mb-5">{room.description}</p>

            <div className="flex items-center gap-2 mb-5 text-sm text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Up to <strong>{room.capacity}</strong> guests</span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-slate-800 mb-3">Amenities</h3>
              <div className="grid grid-cols-1 gap-2">
                {(room.amenities || []).map((a: string) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>

            <Button size="lg" className="w-full" asChild>
              <Link to={`/book/${room.id}`}>Book This Room</Link>
            </Button>

            <p className="mt-3 text-xs text-center text-slate-400">
              Free cancellation · Instant confirmation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
