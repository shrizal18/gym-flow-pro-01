import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, UserX, AlertTriangle } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function DashboardStats() {
  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*, membership_plans(plan_name)");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const now = new Date();
  const active = members?.filter((m) => differenceInDays(parseISO(m.expiry_date), now) > 5) || [];
  const expiringSoon = members?.filter((m) => {
    const days = differenceInDays(parseISO(m.expiry_date), now);
    return days >= 0 && days <= 5;
  }) || [];
  const expired = members?.filter((m) => differenceInDays(parseISO(m.expiry_date), now) < 0) || [];

  const stats = [
    { label: "Total Members", value: members?.length || 0, icon: Users, color: "text-foreground" },
    { label: "Active", value: active.length, icon: UserCheck, color: "text-success" },
    { label: "Expiring Soon", value: expiringSoon.length, icon: AlertTriangle, color: "text-warning" },
    { label: "Expired", value: expired.length, icon: UserX, color: "text-destructive" },
  ];

  const planCounts: Record<string, number> = {};
  members?.forEach((m) => {
    const name = (m.membership_plans as any)?.plan_name || "Unknown";
    planCounts[name] = (planCounts[name] || 0) + 1;
  });
  const pieData = Object.entries(planCounts).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["hsl(0, 72%, 51%)", "hsl(38, 92%, 50%)", "hsl(142, 76%, 36%)"];

  const barData = [
    { name: "Active", count: active.length },
    { name: "Expiring", count: expiringSoon.length },
    { name: "Expired", count: expired.length },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">DASHBOARD</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {expiringSoon.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span className="font-display font-bold text-warning">EXPIRING SOON</span>
          </div>
          <div className="space-y-1">
            {expiringSoon.map((m) => (
              <p key={m.id} className="text-sm text-foreground">
                {m.name} — expires in {differenceInDays(parseISO(m.expiry_date), now)} days
              </p>
            ))}
          </div>
        </div>
      )}

      {expired.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-5 h-5 text-destructive" />
            <span className="font-display font-bold text-destructive">EXPIRED MEMBERSHIPS</span>
          </div>
          <div className="space-y-1">
            {expired.map((m) => (
              <p key={m.id} className="text-sm text-foreground">
                {m.name} — expired {Math.abs(differenceInDays(parseISO(m.expiry_date), now))} days ago
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display text-lg font-bold mb-4">Member Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
              <XAxis dataKey="name" stroke="hsl(0, 0%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(0, 0%, 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(0, 0%, 8%)", border: "1px solid hsl(0, 0%, 18%)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display text-lg font-bold mb-4">Plans Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(0, 0%, 8%)", border: "1px solid hsl(0, 0%, 18%)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
