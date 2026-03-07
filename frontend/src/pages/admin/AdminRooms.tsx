import { useState, useEffect, FormEvent } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/services/api";
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
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price_per_night: "",
  capacity: "",
  total_rooms: "",
  amenities: "",
  image_url: "",
};

export default function AdminRooms() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    adminApi.rooms.list().then((res) => setRooms(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEdit = (rt: RoomType) => {
    setEditing(rt);
    setForm({
      name: rt.name,
      description: rt.description || "",
      price_per_night: String(rt.price_per_night),
      capacity: String(rt.capacity),
      total_rooms: String(rt.total_rooms),
      amenities: (rt.amenities || []).join(", "),
      image_url: rt.image_url || "",
    });
    setShowForm(true);
    setError("");
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price_per_night: Number(form.price_per_night),
      capacity: Number(form.capacity),
      total_rooms: Number(form.total_rooms),
      amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
      image_url: form.image_url || null,
    };
    try {
      if (editing) {
        await adminApi.rooms.update(editing.id, payload);
      } else {
        await adminApi.rooms.create(payload);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Room Management</h1>
              <p className="text-slate-500 text-sm">Edit room types and pricing</p>
            </div>
            <Button onClick={openCreate}>+ Add Room Type</Button>
          </div>

          {/* Form */}
          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{editing ? "Edit Room Type" : "New Room Type"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price per night (LKR)</Label>
                      <Input
                        type="number"
                        value={form.price_per_night}
                        onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Capacity (guests)</Label>
                      <Input
                        type="number"
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total rooms</Label>
                      <Input
                        type="number"
                        value={form.total_rooms}
                        onChange={(e) => setForm({ ...form, total_rooms: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amenities (comma-separated)</Label>
                    <Input
                      placeholder="Air conditioning, Free Wi-Fi, Sea view"
                      value={form.amenities}
                      onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL (optional)</Label>
                    <Input
                      placeholder="https://..."
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving…" : editing ? "Update" : "Create"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0ea5e9]" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Price</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Capacity</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Total</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((rt) => (
                      <tr key={rt.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium">{rt.name}</td>
                        <td className="py-3 px-4">{formatLKR(rt.price_per_night)}</td>
                        <td className="py-3 px-4">{rt.capacity} guests</td>
                        <td className="py-3 px-4">{rt.total_rooms} rooms</td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline" onClick={() => openEdit(rt)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
