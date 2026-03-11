import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, RefreshCw, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { differenceInDays, parseISO, format, addDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PAGE_SIZE = 10;

type Member = {
  id: string; name: string; phone: string; email: string; address: string | null;
  age: number | null; gender: string | null; membership_plan_id: string | null;
  start_date: string; expiry_date: string; payment_status: string; status: string;
  created_at: string; updated_at: string;
  membership_plans: { plan_name: string; duration_days: number } | null;
};

export default function MembersList() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState<Member | null>(null);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("membership_plans").select("*").order("price");
      if (error) throw error;
      return data;
    },
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*, membership_plans(plan_name, duration_days)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Member[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-members"] }); toast.success("Member deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const renewMutation = useMutation({
    mutationFn: async ({ member, days, planId }: { member: Member; days: number; planId: string }) => {
      const newExpiry = addDays(new Date(), days);
      const { error: updateErr } = await supabase.from("members").update({
        expiry_date: format(newExpiry, "yyyy-MM-dd"),
        membership_plan_id: planId,
        status: "active",
      }).eq("id", member.id);
      if (updateErr) throw updateErr;

      const { error: histErr } = await supabase.from("renewal_history").insert({
        member_id: member.id,
        previous_expiry: member.expiry_date,
        new_expiry: format(newExpiry, "yyyy-MM-dd"),
        plan_id: planId,
        renewed_by: user?.id,
      });
      if (histErr) throw histErr;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-members"] }); setShowRenewDialog(null); toast.success("Membership renewed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const getStatus = (expiryDate: string) => {
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return { label: "Expired", className: "bg-destructive/20 text-destructive", days };
    if (days <= 5) return { label: "Expiring Soon", className: "bg-warning/20 text-warning", days };
    return { label: "Active", className: "bg-success/20 text-success", days };
  };

  const filtered = members?.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
    const status = getStatus(m.expiry_date);
    const matchesStatus = statusFilter === "all" || status.label.toLowerCase().includes(statusFilter);
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportCSV = () => {
    if (!members?.length) return;
    const headers = ["Name", "Email", "Phone", "Plan", "Start Date", "Expiry Date", "Status", "Days Remaining"];
    const rows = members.map((m) => {
      const s = getStatus(m.expiry_date);
      return [m.name, m.email, m.phone, m.membership_plans?.plan_name || "", m.start_date, m.expiry_date, s.label, s.days.toString()];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "members.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display text-3xl font-bold">MEMBERS</h1>
        <div className="flex gap-3">
          <Button variant="outline" className="border-border" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Member</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search members..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10 bg-secondary border-border" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 font-display font-bold">Name</th>
                <th className="text-left p-4 font-display font-bold">Phone</th>
                <th className="text-left p-4 font-display font-bold hidden md:table-cell">Plan</th>
                <th className="text-left p-4 font-display font-bold hidden lg:table-cell">Start</th>
                <th className="text-left p-4 font-display font-bold hidden lg:table-cell">Expiry</th>
                <th className="text-left p-4 font-display font-bold">Days</th>
                <th className="text-left p-4 font-display font-bold">Status</th>
                <th className="text-left p-4 font-display font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No members found</td></tr>
              ) : paginated.map((m) => {
                const status = getStatus(m.expiry_date);
                return (
                  <tr key={m.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="p-4"><div className="font-medium">{m.name}</div><div className="text-xs text-muted-foreground">{m.email}</div></td>
                    <td className="p-4">{m.phone}</td>
                    <td className="p-4 hidden md:table-cell">{m.membership_plans?.plan_name || "—"}</td>
                    <td className="p-4 hidden lg:table-cell">{m.start_date}</td>
                    <td className="p-4 hidden lg:table-cell">{m.expiry_date}</td>
                    <td className="p-4 font-bold">{status.days}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${status.className}`}>{status.label}</span></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingMember(m)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowRenewDialog(m)}><RefreshCw className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Delete this member?")) deleteMutation.mutate(m.id); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages} ({filtered.length} members)</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      <AddMemberDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} plans={plans || []} />

      {/* Edit Member Dialog */}
      {editingMember && (
        <EditMemberDialog member={editingMember} onClose={() => setEditingMember(null)} plans={plans || []} />
      )}

      {/* Renew Dialog */}
      {showRenewDialog && (
        <RenewDialog
          member={showRenewDialog}
          plans={plans || []}
          onClose={() => setShowRenewDialog(null)}
          onRenew={(days, planId) => renewMutation.mutate({ member: showRenewDialog, days, planId })}
          loading={renewMutation.isPending}
        />
      )}
    </div>
  );
}

function AddMemberDialog({ open, onClose, plans }: { open: boolean; onClose: () => void; plans: any[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", planId: "", paymentStatus: "paid" });

  const mutation = useMutation({
    mutationFn: async () => {
      const plan = plans.find((p) => p.id === form.planId);
      if (!plan) throw new Error("Select a plan");
      const startDate = new Date();
      const { error } = await supabase.from("members").insert({
        name: form.name, email: form.email, phone: form.phone,
        address: form.address || null, membership_plan_id: form.planId,
        start_date: format(startDate, "yyyy-MM-dd"),
        expiry_date: format(addDays(startDate, plan.duration_days), "yyyy-MM-dd"),
        payment_status: form.paymentStatus, status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-members"] }); onClose(); toast.success("Member added"); setForm({ name: "", email: "", phone: "", address: "", planId: "", paymentStatus: "paid" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">ADD NEW MEMBER</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-secondary border-border" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="bg-secondary border-border" /></div>
            <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="bg-secondary border-border" /></div>
          </div>
          <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-secondary border-border" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Plan *</Label>
              <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} required className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm">
                <option value="">Select plan</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.plan_name}</option>)}
              </select>
            </div>
            <div><Label>Payment</Label>
              <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })} className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm">
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full bg-primary text-primary-foreground font-display">
            {mutation.isPending ? "ADDING..." : "ADD MEMBER"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMemberDialog({ member, onClose, plans }: { member: Member; onClose: () => void; plans: any[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: member.name, email: member.email, phone: member.phone,
    address: member.address || "", planId: member.membership_plan_id || "",
    paymentStatus: member.payment_status,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("members").update({
        name: form.name, email: form.email, phone: form.phone,
        address: form.address || null, membership_plan_id: form.planId || null,
        payment_status: form.paymentStatus,
      }).eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-members"] }); onClose(); toast.success("Member updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">EDIT MEMBER</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-secondary border-border" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="bg-secondary border-border" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="bg-secondary border-border" /></div>
          </div>
          <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-secondary border-border" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Plan</Label>
              <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm">
                <option value="">Select plan</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.plan_name}</option>)}
              </select>
            </div>
            <div><Label>Payment</Label>
              <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })} className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm">
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full bg-primary text-primary-foreground font-display">
            {mutation.isPending ? "SAVING..." : "SAVE CHANGES"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RenewDialog({ member, plans, onClose, onRenew, loading }: { member: Member; plans: any[]; onClose: () => void; onRenew: (days: number, planId: string) => void; loading: boolean }) {
  const [planId, setPlanId] = useState(member.membership_plan_id || "");
  const selectedPlan = plans.find((p) => p.id === planId);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">RENEW MEMBERSHIP</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Renewing membership for <strong className="text-foreground">{member.name}</strong></p>
          <div>
            <Label>Select Plan</Label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm">
              <option value="">Select plan</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.plan_name} — {p.duration_days} days — ${p.price}</option>)}
            </select>
          </div>
          {selectedPlan && (
            <div className="bg-secondary/50 rounded-lg p-3 text-sm">
              <p>New expiry: <strong>{format(addDays(new Date(), selectedPlan.duration_days), "MMM d, yyyy")}</strong></p>
            </div>
          )}
          <Button onClick={() => { if (selectedPlan) onRenew(selectedPlan.duration_days, planId); }} disabled={!selectedPlan || loading} className="w-full bg-primary text-primary-foreground font-display">
            {loading ? "RENEWING..." : "CONFIRM RENEWAL"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Member = {
  id: string; name: string; phone: string; email: string; address: string | null;
  age: number | null; gender: string | null; membership_plan_id: string | null;
  start_date: string; expiry_date: string; payment_status: string; status: string;
  created_at: string; updated_at: string;
  membership_plans: { plan_name: string; duration_days: number } | null;
};
