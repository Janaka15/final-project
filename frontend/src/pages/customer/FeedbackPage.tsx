import { useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { feedbackApi } from "@/services/api";
import { Check, Star } from "lucide-react";

const STARS = [1, 2, 3, 4, 5];

export default function FeedbackPage() {
  const { bookingId } = useParams();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await feedbackApi.submit({
        booking_id: Number(bookingId),
        rating,
        comment: comment || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank you!</h2>
          <p className="text-slate-500 mb-6">Your feedback helps us improve.</p>
          <Button asChild>
            <Link to="/my-bookings">Back to My Bookings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Leave Feedback</h1>

        <Card>
          <CardHeader>
            <CardTitle>How was your stay?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-2">
                  {STARS.map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className="w-8 h-8"
                        fill={star <= (hovered || rating) ? "#f59e0b" : "none"}
                        stroke={star <= (hovered || rating) ? "#f59e0b" : "#94a3b8"}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-slate-500">
                    {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Comments (optional)</Label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
                  placeholder="Tell us about your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting…" : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
