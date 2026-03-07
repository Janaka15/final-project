import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ChatWidget from "@/components/ChatWidget/ChatWidget";
import { Waves, Palmtree, Fish, Utensils, type LucideIcon } from "lucide-react";

const HIGHLIGHTS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Waves,
    title: "Beachfront Location",
    desc: "Steps from Mirissa beach, one of Sri Lanka's most beautiful coastlines.",
  },
  {
    icon: Palmtree,
    title: "15 Boutique Rooms",
    desc: "Standard, Deluxe, and Suite categories — all with ocean breezes.",
  },
  {
    icon: Fish,
    title: "Whale Watching Hub",
    desc: "Mirissa is the #1 whale watching spot in Sri Lanka. We arrange tours.",
  },
  {
    icon: Utensils,
    title: "Sri Lankan Cuisine",
    desc: "Authentic local breakfast and dinner served with sea views.",
  },
];

const ROOM_PREVIEWS = [
  {
    name: "Standard",
    price: "LKR 25,000",
    desc: "Garden or pool view, perfect for couples.",
    img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80",
  },
  {
    name: "Deluxe",
    price: "LKR 40,000",
    desc: "Sea view, private balcony, sofa bed.",
    img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
  },
  {
    name: "Suite",
    price: "LKR 65,000",
    desc: "Ocean-facing suite with private plunge pool.",
    img: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600&q=80",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section
        className="relative h-[90vh] flex items-center justify-center text-white text-center px-4"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-[#7dd3fc] mb-4">
            Mirissa, Sri Lanka
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
            Somerset Mirissa<br />Beach Hotel
          </h1>
          <p className="text-xl text-slate-200 mb-8 max-w-xl mx-auto">
            A boutique beachfront retreat on the southern coast of Sri Lanka.
            Where the ocean meets unforgettable hospitality.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8">
              <Link to="/rooms">Explore Rooms</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white hover:text-slate-900 px-8"
              asChild
            >
              <Link to="/rooms">Check Availability</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            The Somerset Experience
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Everything you need for a perfect beach holiday on Sri Lanka's southern coast.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HIGHLIGHTS.map((h) => (
            <Card key={h.title} className="text-center p-2">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <h.icon className="w-10 h-10 text-[#0ea5e9]" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{h.title}</h3>
                <p className="text-sm text-slate-500">{h.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Room previews */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Our Rooms</h2>
            <p className="text-slate-500">
              15 rooms across three categories — from comfortable standard to ultra-luxury suites.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ROOM_PREVIEWS.map((room) => (
              <Card key={room.name} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={room.img}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-slate-900">{room.name} Room</h3>
                    <span className="text-sm font-semibold text-[#0ea5e9]">
                      {room.price}<span className="text-slate-400 font-normal">/night</span>
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{room.desc}</p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/rooms">View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" asChild>
              <Link to="/rooms">View All Rooms & Book</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-[#0ea5e9]">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready for your beach getaway?
        </h2>
        <p className="text-[#bae6fd] mb-8 max-w-lg mx-auto">
          Book directly for the best rates. No hidden fees. Instant confirmation.
        </p>
        <Button
          size="lg"
          className="bg-white text-[#0ea5e9] hover:bg-slate-100 px-10"
          asChild
        >
          <Link to="/rooms">Book Your Stay</Link>
        </Button>
      </section>

      <ChatWidget />

      <footer className="bg-slate-900 text-slate-400 py-10 px-4 text-center text-sm">
        <p className="font-medium text-white mb-2">Somerset Mirissa Beach Hotel</p>
        <p>Mirissa, Southern Province, Sri Lanka</p>
        <p className="mt-1">+94 41 225 9999 · info@somersetmirissa.com</p>
        <p className="mt-4 text-slate-600">
          © {new Date().getFullYear()} Somerset Mirissa Beach Hotel. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
