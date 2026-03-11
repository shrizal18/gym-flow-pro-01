import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dumbbell, LayoutDashboard, Users, LogOut, ShieldCheck } from "lucide-react";
import DashboardStats from "@/components/admin/DashboardStats";
import MembersList from "@/components/admin/MembersList";
import UserManagement from "@/components/admin/UserManagement";

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "members" | "users">("dashboard");

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "members" as const, label: "Members", icon: Users },
    { id: "users" as const, label: "User Roles", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 flex flex-col z-40">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Dumbbell className="w-6 h-6 text-primary" />
          <span className="font-display text-lg font-bold">IRONFORGE</span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">ADMIN</span>
        </div>

        <nav className="space-y-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <Button
          variant="outline"
          className="border-border text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </aside>

      {/* Main */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === "dashboard" && <DashboardStats />}
          {activeTab === "members" && <MembersList />}
          {activeTab === "users" && <UserManagement />}
        </div>
      </main>
    </div>
  );
}
