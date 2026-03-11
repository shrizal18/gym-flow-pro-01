import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dumbbell, ArrowLeft } from "lucide-react";
import { addDays, format } from "date-fns";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").max(20),
  address: z.string().max(500).optional(),
  age: z.number().min(14).max(120).optional(),
  gender: z.string().optional(),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlanId = searchParams.get("plan");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", age: "", gender: "",
  });
  const [planId, setPlanId] = useState(selectedPlanId || "");

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("membership_plans").select("*").order("price");
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const validated = registerSchema.parse({
        ...form,
        age: form.age ? parseInt(form.age) : undefined,
      });
      const plan = plans?.find((p) => p.id === planId);
      if (!plan) throw new Error("Please select a plan");

      const startDate = new Date();
      const expiryDate = addDays(startDate, plan.duration_days);

      const { error } = await supabase.from("members").insert({
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        address: validated.address || null,
        age: validated.age || null,
        gender: validated.gender || null,
        membership_plan_id: planId,
        start_date: format(startDate, "yyyy-MM-dd"),
        expiry_date: format(expiryDate, "yyyy-MM-dd"),
        payment_status: "pending",
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registration successful! Welcome to IronForge.");
      navigate("/");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Dumbbell className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold">JOIN IRONFORGE</h1>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="bg-secondary border-border" />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age</Label>
                <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div>
                <Label>Gender</Label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Membership Plan *</Label>
              <select value={planId} onChange={(e) => setPlanId(e.target.value)} required className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm">
                <option value="">Select a plan</option>
                {plans?.map((p) => (
                  <option key={p.id} value={p.id}>{p.plan_name} - ${p.price} / {p.duration_days} days</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display text-lg py-6">
              {mutation.isPending ? "REGISTERING..." : "REGISTER NOW"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
