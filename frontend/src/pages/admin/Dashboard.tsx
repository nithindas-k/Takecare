/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { motion, AnimatePresence } from "framer-motion";
import { Bar, BarChart, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Pie, PieChart, Sector, Label } from "recharts";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Download, Loader2 } from "lucide-react";
import adminService from "../../services/adminService";
import { toast } from "sonner";
import { FaUserMd, FaUsers, FaCalendarCheck, FaMoneyBillWave } from "react-icons/fa";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { DatePicker } from "../../components/ui/date-picker";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const statusChartConfig = {
  appointments: {
    label: "Appointments",
  },
  completed: {
    label: "Completed",
    color: "#00A1B0",
  },
  cancelled: {
    label: "Cancelled",
    color: "#F43F5E",
  },
  pending: {
    label: "Pending",
    color: "#F59E0B",
  },
  confirmed: {
    label: "Confirmed",
    color: "#6366F1",
  },
} satisfies ChartConfig;

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [activeStatus, setActiveStatus] = useState("completed");

  const chartData = useMemo(() => {
    if (!stats?.revenueGraph) return [];
    return stats.revenueGraph.map((item: any) => ({
      date: item.date,
      revenue: item.amount || 0,
      appointments: item.appointments || 0,
    }));
  }, [stats]);

  const totals = useMemo(() => {
    if (!chartData.length) return { revenue: 0, appointments: 0 };
    return {
      revenue: chartData.reduce((acc: number, curr: any) => acc + curr.revenue, 0),
      appointments: chartData.reduce((acc: number, curr: any) => acc + curr.appointments, 0),
    };
  }, [chartData]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const startDate = dateRange?.from?.toISOString();
        const endDate = dateRange?.to?.toISOString();
        const response = await adminService.getDashboardStats(startDate, endDate);

        if (response && response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("❌ Error fetching stats:", error);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      toast.info("Generating report...");
      const startDate = dateRange?.from?.toISOString();
      const endDate = dateRange?.to?.toISOString();

      const response = await adminService.getReportData(startDate, endDate);

      if (!response.success || !response.data) {
        throw new Error("Failed to fetch report data");
      }

      const { summary, appointments } = response.data;
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 161, 176); // Brand Color (Cyan)
      doc.text("TakeCare - Financial & Activity Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${format(new Date(), "PPP p")}`, 14, 30);

      let dateText = "Overall";
      if (dateRange?.from) {
        dateText = `${format(dateRange.from, "PPP")}`;
        if (dateRange.to) dateText += ` - ${format(dateRange.to, "PPP")}`;
      }
      doc.text(`Period: ${dateText}`, 14, 35);

      // Summary Section
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Financial Summary (Booking Basis)", 14, 45);

      const summaryData = [
        ["Total Transaction Volume", `Rs. ${summary.totalVolume.toLocaleString()}`],
        ["(-) Total Refunds Processed", `Rs. ${summary.totalRefunds.toLocaleString()}`],
        ["(=) Net Revenue", `Rs. ${summary.netRevenue.toLocaleString()}`],
        ["", ""], // Spacer
        ["Doctor Payouts (Completed)", `Rs. ${summary.doctorPayout.toLocaleString()}`],
        ["Platform Earnings (Completed)", `Rs. ${summary.adminEarnings.toLocaleString()}`],
        ["Unrealized/Held Amount", `Rs. ${summary.heldAmount.toLocaleString()}`],
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Amount']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [0, 161, 176], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });

      // Appointment Details
      const finalY = (doc as any).lastAutoTable.finalY || 60;
      doc.setFontSize(14);
      doc.text("Detailed Appointments Log", 14, finalY + 15);

      const tableRows = appointments.map((appt: any) => [
        format(new Date(appt.createdAt), "dd/MM/yyyy"),
        appt.customId || "-",
        appt.doctorId?.userId?.name || appt.doctor?.name || "Unknown Doctor",
        appt.patientId?.name || "Unknown Patient",
        appt.status,
        appt.paymentStatus,
        `Rs. ${appt.consultationFees}`,
        `Rs. ${appt.adminCommission}`,
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Date', 'ID', 'Doctor', 'Patient', 'Status', 'Payment', 'Fee', 'Admin Fee']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          6: { halign: 'right' },
          7: { halign: 'right' }
        },
        margin: { left: 14, right: 14 },
      });

      doc.save(`TakeCare_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Report downloaded successfully");

    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const statusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Completed", value: stats.statusDistribution.completed, fill: "#00A1B0" },
      { name: "Confirmed", value: stats.statusDistribution.confirmed, fill: "#6366F1" },
      { name: "Pending", value: stats.statusDistribution.pending, fill: "#F59E0B" },
      { name: "Cancelled", value: stats.statusDistribution.cancelled, fill: "#F43F5E" },
    ];
  }, [stats]);

  const totalAppointments = useMemo(() => {
    return statusData.reduce((acc, curr) => acc + curr.value, 0);
  }, [statusData]);

  const completedPercentage = useMemo(() => {
    if (totalAppointments === 0) return 0;
    const completed = statusData.find(s => s.name === "Completed")?.value || 0;
    return ((completed / totalAppointments) * 100).toFixed(1);
  }, [statusData, totalAppointments]);

  const activeIndex = useMemo(
    () => statusData.findIndex((item) => item.name.toLowerCase() === activeStatus),
    [activeStatus, statusData]
  );

  const statCards = stats ? [
    { icon: <FaUsers className="w-6 h-6 text-cyan-600" />, value: stats.totalAppointments, label: "Total Appts", bg: "bg-cyan-50" },
    { icon: <FaMoneyBillWave className="w-6 h-6 text-indigo-600" />, value: `₹${stats.totalRevenue}`, label: "Platform Revenue", bg: "bg-indigo-50" },
    { icon: <FaUserMd className="w-6 h-6 text-purple-600" />, value: stats.topDoctors?.length || 0, label: "Top Doctors", bg: "bg-purple-50" },
    { icon: <FaCalendarCheck className="w-6 h-6 text-violet-600" />, value: stats.statusDistribution.pending, label: "Pending", bg: "bg-violet-50" }
  ] : [];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50"><Sidebar /></div>
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          <TopNav onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 px-8 py-6">
            <div className="w-full max-w-7xl mx-auto space-y-8">
              <Skeleton className="h-40 w-full rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 border border-gray-100">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                  <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-64 w-64 rounded-full mx-auto" />
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 no-scrollbar">
      <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 30, stiffness: 450 }}
              className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl"
            >
              <Sidebar onMobileClose={() => setSidebarOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="bg-primary/10 rounded-lg py-6 sm:py-8 md:py-10 mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-gray-500 mt-2">Overview of platform performance</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Global Statistics Filter</h2>
                <p className="text-[10px] text-gray-400 font-medium italic">All charts and tables below are updated automatically</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex p-1 bg-gray-50 rounded-lg border">
                  <Button size="sm" variant={!dateRange ? "default" : "ghost"} onClick={() => setDateRange(undefined)} className="text-[10px] h-7 px-3 rounded-md">Overall</Button>
                  <Button size="sm" variant={dateRange?.from?.toDateString() === new Date().toDateString() ? "default" : "ghost"} onClick={() => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })} className="text-[10px] h-7 px-3 rounded-md">Today</Button>
                  <Button size="sm" variant={dateRange?.from?.toDateString() === subDays(new Date(), 7).toDateString() ? "default" : "ghost"} onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })} className="text-[10px] h-7 px-3 rounded-md">7 Days</Button>
                  <Button size="sm" variant={dateRange?.from?.toDateString() === subDays(new Date(), 30).toDateString() ? "default" : "ghost"} onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })} className="text-[10px] h-7 px-3 rounded-md">30 Days</Button>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">From</span>
                    <DatePicker date={dateRange?.from} setDate={(d) => setDateRange(prev => ({ from: d, to: prev?.to }))} className="w-[125px] h-7 text-[10px] border-none bg-transparent shadow-none" />
                  </div>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">To</span>
                    <DatePicker date={dateRange?.to} setDate={(d) => setDateRange(prev => ({ from: prev?.from, to: d }))} className="w-[125px] h-7 text-[10px] border-none bg-transparent shadow-none" />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleDownloadReport}
                  disabled={downloading}
                  className="h-7 text-xs bg-gray-800 hover:bg-gray-700 text-white gap-2"
                >
                  {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  PDF Report
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {statCards.map((card, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className={cn("p-4 rounded-xl", card.bg)}>{card.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{totals.revenue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-[480px] bg-white">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: 'rgba(0, 161, 176, 0.1)' }} />
                      <Bar dataKey="revenue" fill="#00A1B0" radius={[8, 8, 0, 0]} barSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Card data-chart="status-pie" className="flex flex-col shadow-sm border-gray-100">
                <ChartStyle id="status-pie" config={statusChartConfig} />
                <CardHeader className="flex-row items-start space-y-0 pb-0">
                  <div className="grid gap-1">
                    <CardTitle className="text-lg font-semibold text-gray-800">Appointment Status</CardTitle>
                    <CardDescription className="text-xs text-gray-500">Distribution for selected period</CardDescription>
                  </div>
                  <Select value={activeStatus} onValueChange={setActiveStatus}>
                    <SelectTrigger className="ml-auto h-7 w-[130px] rounded-lg pl-2.5 text-xs" aria-label="Select status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent align="end" className="rounded-xl">
                      {statusData.map((item) => {
                        const key = item.name.toLowerCase();
                        return (
                          <SelectItem key={key} value={key} className="rounded-lg [&_span]:flex">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="flex h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.fill }} />
                              {item.name}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="flex flex-1 justify-center pb-0">
                  <ChartContainer id="status-pie" config={statusChartConfig} className="mx-auto aspect-square w-full max-w-[300px]">
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                        activeIndex={activeIndex}
                        activeShape={(props: any) => {
                          const { outerRadius = 0, ...rest } = props;
                          return (
                            <g>
                              <Sector {...rest} outerRadius={outerRadius + 10} />
                              <Sector {...rest} outerRadius={outerRadius + 25} innerRadius={outerRadius + 12} />
                            </g>
                          )
                        }}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">{statusData[activeIndex]?.value.toLocaleString() || 0}</tspan>
                                  <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-xs">{statusData[activeIndex]?.name}</tspan>
                                </text>
                              )
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>

                <div className="px-6 pb-4 pt-2">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-cyan-50/50 border border-cyan-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#00A1B0]"></div>
                        <span className="text-xs font-medium text-gray-700">Completed</span>
                      </div>
                      <span className="text-lg font-bold text-cyan-600">{stats?.statusDistribution.completed || 0}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#6366F1]"></div>
                        <span className="text-xs font-medium text-gray-700">Confirmed</span>
                      </div>
                      <span className="text-lg font-bold text-indigo-600">{stats?.statusDistribution.confirmed || 0}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                        <span className="text-xs font-medium text-gray-700">Pending</span>
                      </div>
                      <span className="text-lg font-bold text-amber-600">{stats?.statusDistribution.pending || 0}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-rose-50/50 border border-rose-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#F43F5E]"></div>
                        <span className="text-xs font-medium text-gray-700">Cancelled</span>
                      </div>
                      <span className="text-lg font-bold text-rose-600">{stats?.statusDistribution.cancelled || 0}</span>
                    </div>
                  </div>
                </div>

                <CardFooter className="flex-col gap-2 text-sm pt-0">
                  <div className="flex items-center gap-2 leading-none font-medium text-gray-900">{completedPercentage}% completion rate <TrendingUp className="h-4 w-4 text-cyan-600" /></div>
                  <div className="text-gray-500 leading-none text-xs">Total {totalAppointments} appointments in selected range</div>
                </CardFooter>
              </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Top Performing Doctors</h3>
                <p className="text-xs text-gray-500 mt-1">Based on completed appointments</p>
              </div>

              <div className="p-6">
                {stats?.topDoctors?.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topDoctors.map((doc: any, idx: number) => {
                      // Helper function to get profile image URL
                      const getProfileImageUrl = (profileImage: string | undefined) => {
                        if (!profileImage) return null;
                        if (profileImage.startsWith('http')) return profileImage;
                        return `http://localhost:5000${profileImage}`;
                      };

                      const profileImageUrl = getProfileImageUrl(doc.profileImage);

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-gray-50/50 transition-all"
                        >
                          {/* Left: Rank + Doctor Info */}
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Rank */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                            </div>

                            {/* Profile Image */}
                            <div className="flex-shrink-0">
                              {profileImageUrl ? (
                                <img
                                  src={profileImageUrl}
                                  alt={doc.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className={cn(
                                  "w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center text-white text-lg font-semibold border-2 border-gray-100",
                                  profileImageUrl && "hidden"
                                )}
                              >
                                {doc.name.charAt(0).toUpperCase()}
                              </div>
                            </div>

                            {/* Name & Specialty */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">Dr. {doc.name}</h4>
                              <p className="text-sm text-gray-500 truncate">{doc.specialty || 'Medical Professional'}</p>
                            </div>
                          </div>

                          {/* Right: Stats */}
                          <div className="flex items-center gap-6 ml-4">
                            {/* Appointments */}
                            <div className="text-center">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Appointments</p>
                              <p className="text-xl font-bold text-primary">{doc.appointments}</p>
                            </div>

                            {/* Revenue */}
                            <div className="text-center">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Revenue</p>
                              <p className="text-xl font-bold text-gray-900">₹{doc.revenue.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">📊</span>
                    </div>
                    <p className="text-gray-500">No data available for the selected date range</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main >
      </div >
    </div >
  );
};

export default Dashboard;

