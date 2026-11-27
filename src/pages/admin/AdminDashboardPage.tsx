import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getFunctionErrorMessage, invokeAdminOperation, invokeClubkonnectBalance } from "@/lib/admin-functions";
import { supabase } from "@/integrations/supabase/client";
import { KYC_LIMITS, formatNaira as fmtN } from "@/lib/kyc-limits";
import {
  Loader2, Users, Wallet, CreditCard, ArrowUpDown, Briefcase, Clock,
  TrendingUp, Smartphone, Store, Zap, Calculator, Crown, RefreshCw, ShieldCheck,
} from "lucide-react";


interface Stats {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  suspended: number;
  totalWalletBalance: number;
  totalCollections: number;
  activeCollections: number;
  completedCollections: number;
  totalCollectionValue: number;
  txToday: number;
  txWeek: number;
  txMonth: number;
  openErrands: number;
  inProgressErrands: number;
  disputedErrands: number;
  pendingWithdrawals: number;
  processingWithdrawals: number;
  pendingWithdrawalAmount: number;
}

interface Revenue {
  totalFloat: number;
  dailyInterest: number;
  projectedMonthlyFloat: number;
  mtdFloatRevenue: number;
  airtimeCommission: number;
  dataCommission: number;
  totalAirtimeDataCommission: number;
  merchantVolume: number;
  merchantFeeRevenue: number;
  withdrawalFeeRevenue: number;
  mrr: number;
  proCount: number;
  freeCount: number;
  totalMonthlyRevenue: number;
}

const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakeven, setShowBreakeven] = useState(false);
  const [ckBalance, setCkBalance] = useState<string | null>(null);
  const [ckRaw, setCkRaw] = useState<any>(null);
  const [ckLoading, setCkLoading] = useState(false);
  const [ckError, setCkError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadClubkonnect = async () => {
    setCkLoading(true);
    setCkError(null);
    try {
      const { data: body, error } = await invokeClubkonnectBalance();
      if (body?.success) {
        setCkRaw(body.raw ?? null);
        const n = typeof body.balance === "number" ? body.balance : Number(body.balance);
        if (Number.isFinite(n)) {
          setCkBalance(formatNaira(n));
        } else {
          setCkBalance(typeof body.raw === "string" ? body.raw : JSON.stringify(body.raw));
        }
      } else {
        setCkError(getFunctionErrorMessage(body, error, "Failed to load"));
      }
    } catch (e: any) {
      setCkError(e?.message || "Failed to load");
    } finally {
      setCkLoading(false);
    }
  };

  useEffect(() => { loadClubkonnect(); }, []);

  // Break-even inputs
  const [mau, setMau] = useState(1000);
  const [avgBalance, setAvgBalance] = useState(5000);
  const [merchantCount, setMerchantCount] = useState(20);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, revenueRes] = await Promise.all([
          invokeAdminOperation({ action: "get_dashboard_stats" }),
          invokeAdminOperation({ action: "get_revenue_stats" }),
        ]);

        const statsBody = statsRes.data;
        const revenueBody = revenueRes.data;

        if (statsBody?.success) setStats(statsBody.stats);
        if (revenueBody?.success) setRevenue(revenueBody.revenue);
        if (!statsBody?.success) {
          setDashboardError(getFunctionErrorMessage(statsBody, statsRes.error, "Failed to load admin stats"));
        }
      } catch (e: any) {
        setDashboardError(e?.message || "Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return <p className="text-center text-muted-foreground">{dashboardError || "Failed to load stats"}</p>;

  const operationalWidgets = [
    {
      title: "Users",
      icon: Users,
      items: [
        { label: "Total", value: stats.totalUsers },
        { label: "Active", value: stats.activeUsers },
        { label: "Pending KYC", value: stats.pendingKyc },
        { label: "Suspended", value: stats.suspended },
      ],
    },
    {
      title: "Total Wallet Balance",
      icon: Wallet,
      items: [{ label: "All Users", value: formatNaira(stats.totalWalletBalance), mono: true }],
    },
    {
      title: "Collections",
      icon: CreditCard,
      items: [
        { label: "Total", value: stats.totalCollections },
        { label: "Active", value: stats.activeCollections },
        { label: "Completed", value: stats.completedCollections },
        { label: "Total Value", value: formatNaira(stats.totalCollectionValue), mono: true },
      ],
    },
    {
      title: "Transactions",
      icon: ArrowUpDown,
      items: [
        { label: "Today", value: stats.txToday },
        { label: "This Week", value: stats.txWeek },
        { label: "This Month", value: stats.txMonth },
      ],
    },
    {
      title: "Errands",
      icon: Briefcase,
      items: [
        { label: "Open", value: stats.openErrands },
        { label: "In Progress", value: stats.inProgressErrands },
        { label: "Disputed", value: stats.disputedErrands },
      ],
    },
    {
      title: "Withdrawal Queue",
      icon: Clock,
      items: [
        { label: "Pending", value: stats.pendingWithdrawals },
        { label: "Processing", value: stats.processingWithdrawals },
        { label: "Pending Amount", value: formatNaira(stats.pendingWithdrawalAmount), mono: true },
      ],
    },
  ];

  // Break-even calculation
  const beFloatRevenue = mau * avgBalance * 0.10 / 12;
  const beAirtimeRevenue = mau * 0.3 * 500 * 0.03; // 30% buy airtime, avg ₦500, 3% commission
  const beMerchantRevenue = merchantCount * 50000 * 0.015; // avg ₦50k/month volume per merchant
  const beWithdrawalRevenue = mau * 0.2 * 100; // 20% use instant, ₦100 fee
  const beSubscriptionRevenue = merchantCount * 0.1 * 500; // 10% on pro tier
  const beTotalRevenue = beFloatRevenue + beAirtimeRevenue + beMerchantRevenue + beWithdrawalRevenue + beSubscriptionRevenue;

  // Estimated costs
  const beFlutterwaveFees = mau * 0.4 * 2000 * 0.015; // 40% transact, avg ₦2k, 1.5% FW fee
  const beServerCosts = 50000; // ~₦50k/month
  const beTotalCosts = beFlutterwaveFees + beServerCosts;
  const beNetProfit = beTotalRevenue - beTotalCosts;

  return (
    <div className="space-y-6">
      {/* Operations Overview */}
      <div>
        <h2 className="text-xl font-bold">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground">Real-time platform metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {operationalWidgets.map((w) => (
          <Card key={w.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <w.icon className="h-4 w-4 text-primary" />
                {w.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {w.items.map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-semibold ${(item as any).mono ? "font-mono-num" : ""}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            Clubkonnect Provider Wallet
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={loadClubkonnect} disabled={ckLoading}>
            <RefreshCw className={`h-4 w-4 ${ckLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {ckError ? (
            <p className="text-sm text-destructive">{ckError}</p>
          ) : ckLoading && !ckBalance ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance</span>
              <span className="text-lg font-bold font-mono-num">
                {ckBalance || "—"}
              </span>
            </div>
          )}
          {ckRaw && typeof ckRaw === "object" && (
            <p className="text-[11px] text-muted-foreground mt-2">
              API account: {ckRaw.id || "unknown"}{ckRaw.phoneno ? ` • ${ckRaw.phoneno}` : ""}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">
            Top up at clubkonnect.com if low — "Insufficient API balance" means this wallet is empty.
          </p>
        </CardContent>
      </Card>


      {/* Revenue Section */}
      {revenue && (
        <>
          <Separator />
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" /> Revenue Analytics
            </h2>
            <p className="text-sm text-muted-foreground">Month-to-date revenue breakdown</p>
          </div>

          {/* Total Revenue Banner */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Monthly Revenue (MTD)</p>
                <p className="text-3xl font-bold font-mono-num text-primary">
                  {formatNaira(revenue.totalMonthlyRevenue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Projected this month</p>
                <p className="text-lg font-semibold font-mono-num">
                  {formatNaira(revenue.projectedMonthlyFloat + revenue.totalAirtimeDataCommission * 2 + revenue.merchantFeeRevenue * 2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Float Interest */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Float Interest Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Float</span>
                  <span className="text-sm font-semibold font-mono-num">{formatNaira(revenue.totalFloat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily Accrual (0.027%)</span>
                  <span className="text-sm font-semibold font-mono-num">{formatNaira(revenue.dailyInterest)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">MTD Interest</span>
                  <span className="text-sm font-semibold font-mono-num">{formatNaira(revenue.mtdFloatRevenue)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Projected Monthly</span>
                  <span className="text-sm font-bold font-mono-num text-accent">{formatNaira(revenue.projectedMonthlyFloat)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Airtime & Data Commission */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Airtime & Data Commission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Airtime (3%)</span>
                  <span className="text-sm font-semibold font-mono-num">{formatNaira(revenue.airtimeCommission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data (4%)</span>
                  <span className="text-sm font-semibold font-mono-num">{formatNaira(revenue.dataCommission)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total This Month</span>
                  <span className="text-sm font-bold font-mono-num text-primary">{formatNaira(revenue.totalAirtimeDataCommission)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Merchant Settlement Fees */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  Merchant Revenue (1.5%)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transaction Volume</span>
                  <span className="text-sm font-semibold font-mono-num">{formatNaira(revenue.merchantVolume)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Fee Revenue</span>
                  <span className="text-sm font-bold font-mono-num text-primary">{formatNaira(revenue.merchantFeeRevenue)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Urgency Fees */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-destructive" />
                  Urgency Fee Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Instant Withdrawal Fees (₦100)</span>
                  <span className="text-sm font-semibold font-mono-num">{formatNaira(revenue.withdrawalFeeRevenue)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Premium */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Crown className="h-4 w-4 text-accent" />
                  Organizer Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Free Tier</span>
                  <span className="text-sm font-semibold">{revenue.freeCount} users</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pro Tier (₦500/mo)</span>
                  <span className="text-sm font-semibold">{revenue.proCount} users</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">MRR</span>
                  <span className="text-sm font-bold font-mono-num text-accent">{formatNaira(revenue.mrr)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Break-Even Calculator */}
      <Separator />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Break-Even Calculator
          </h2>
          <p className="text-sm text-muted-foreground">Project revenue vs costs</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowBreakeven(!showBreakeven)}>
          {showBreakeven ? "Hide" : "Show"}
        </Button>
      </div>

      {showBreakeven && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Inputs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Monthly Active Users</label>
                <Input
                  type="number"
                  value={mau}
                  onChange={(e) => setMau(Number(e.target.value) || 0)}
                  className="font-mono-num"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Average Wallet Balance (₦)</label>
                <Input
                  type="number"
                  value={avgBalance}
                  onChange={(e) => setAvgBalance(Number(e.target.value) || 0)}
                  className="font-mono-num"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Active Merchants / Organizers</label>
                <Input
                  type="number"
                  value={merchantCount}
                  onChange={(e) => setMerchantCount(Number(e.target.value) || 0)}
                  className="font-mono-num"
                />
              </div>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Projected Monthly P&L</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Float Interest (10% p.a.)</span>
                <span className="font-mono-num">{formatNaira(beFloatRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Airtime Commission</span>
                <span className="font-mono-num">{formatNaira(beAirtimeRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Merchant Fees (1.5%)</span>
                <span className="font-mono-num">{formatNaira(beMerchantRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Instant Withdrawal Fees</span>
                <span className="font-mono-num">{formatNaira(beWithdrawalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pro Subscriptions</span>
                <span className="font-mono-num">{formatNaira(beSubscriptionRevenue)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Total Revenue</span>
                <span className="font-mono-num text-accent">{formatNaira(beTotalRevenue)}</span>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Costs</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Flutterwave Fees</span>
                <span className="font-mono-num">{formatNaira(beFlutterwaveFees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Server & Infra</span>
                <span className="font-mono-num">{formatNaira(beServerCosts)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Total Costs</span>
                <span className="font-mono-num text-destructive">{formatNaira(beTotalCosts)}</span>
              </div>

              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Net Profit</span>
                <span className={`font-mono-num ${beNetProfit >= 0 ? "text-accent" : "text-destructive"}`}>
                  {formatNaira(beNetProfit)}
                </span>
              </div>
              <p className={`text-xs text-center font-semibold ${beNetProfit >= 0 ? "text-accent" : "text-destructive"}`}>
                {beNetProfit >= 0 ? "✅ Profitable" : "⚠️ Below break-even"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
