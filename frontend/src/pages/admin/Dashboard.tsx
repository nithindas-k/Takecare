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
import { TrendingUp } from "lucide-react";
import adminService from "../../services/adminService";
import { toast } from "sonner";
import { FaUserMd, FaUsers, FaCalendarCheck, FaMoneyBillWave } from "react-icons/fa";
import { subDays, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { DatePicker } from "../../components/ui/date-picker";
import { Button } from "../../components/ui/button";

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
} satisfies ChartConfig;

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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
        console.log('🔍 Fetching stats with date range:', {
          from: dateRange?.from?.toISOString(),
          to: dateRange?.to?.toISOString()
        });

        const startDate = dateRange?.from?.toISOString();
        const endDate = dateRange?.to?.toISOString();
        const response = await adminService.getDashboardStats(startDate, endDate);

        console.log('📊 Dashboard stats response:', response);

        if (response && response.success && response.data) {
          console.log('📊 Complete stats data:', {
            totalAppointments: response.data.totalAppointments,
            totalRevenue: response.data.totalRevenue,
            statusDistribution: response.data.statusDistribution,
            revenueGraph: response.data.revenueGraph?.length,
            topDoctors: response.data.topDoctors?.length
          });
          setStats(response.data);
          console.log('✅ Stats updated successfully');
        } else {
          console.warn('⚠️ No data received from API');
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

  const statusData = stats ? [
    { name: "Completed", value: stats.statusDistribution.completed, fill: "#00A1B0" },
    { name: "Cancelled", value: stats.statusDistribution.cancelled, fill: "#F43F5E" },
    { name: "Pending", value: stats.statusDistribution.pending, fill: "#F59E0B" },
  ] : [];

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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 no-scrollbar">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Overlay */}
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
            {/* Header */}
            <div className="bg-primary/10 rounded-lg py-6 sm:py-8 md:py-10 mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-gray-500 mt-2">Overview of platform performance</p>
            </div>

            {/* Global Date Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Global Statistics Filter</h2>
                <p className="text-[10px] text-gray-400 font-medium italic">All charts and tables below are updated automatically</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex p-1 bg-gray-50 rounded-lg border">
                  <Button
                    size="sm"
                    variant={!dateRange ? "default" : "ghost"}
                    onClick={() => setDateRange(undefined)}
                    className="text-[10px] h-7 px-3 rounded-md"
                  >
                    Overall
                  </Button>
                  <Button
                    size="sm"
                    variant={dateRange?.from?.toDateString() === new Date().toDateString() ? "default" : "ghost"}
                    onClick={() => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })}
                    className="text-[10px] h-7 px-3 rounded-md"
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant={dateRange?.from?.toDateString() === subDays(new Date(), 7).toDateString() ? "default" : "ghost"}
                    onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                    className="text-[10px] h-7 px-3 rounded-md"
                  >
                    7 Days
                  </Button>
                  <Button
                    size="sm"
                    variant={dateRange?.from?.toDateString() === subDays(new Date(), 30).toDateString() ? "default" : "ghost"}
                    onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                    className="text-[10px] h-7 px-3 rounded-md"
                  >
                    30 Days
                  </Button>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">From</span>
                    <DatePicker
                      date={dateRange?.from}
                      setDate={(d) => setDateRange(prev => ({ from: d, to: prev?.to }))}
                      className="w-[125px] h-7 text-[10px] border-none bg-transparent shadow-none"
                    />
                  </div>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">To</span>
                    <DatePicker
                      date={dateRange?.to}
                      setDate={(d) => setDateRange(prev => ({ from: prev?.from, to: d }))}
                      className="w-[125px] h-7 text-[10px] border-none bg-transparent shadow-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Revenue Bar Chart */}
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
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        cursor={{ fill: 'rgba(0, 161, 176, 0.1)' }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#00A1B0"
                        radius={[8, 8, 0, 0]}
                        barSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Interactive Pie Chart */}
              <Card data-chart="status-pie" className="flex flex-col shadow-sm border-gray-100">
                <ChartStyle id="status-pie" config={statusChartConfig} />
                <CardHeader className="flex-row items-start space-y-0 pb-0">
                  <div className="grid gap-1">
                    <CardTitle className="text-lg font-semibold text-gray-800">Appointment Status</CardTitle>
                    <CardDescription className="text-xs text-gray-500">Distribution for selected period</CardDescription>
                  </div>
                  <Select value={activeStatus} onValueChange={setActiveStatus}>
                    <SelectTrigger
                      className="ml-auto h-7 w-[130px] rounded-lg pl-2.5 text-xs"
                      aria-label="Select status"
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent align="end" className="rounded-xl">
                      {statusData.map((item) => {
                        const key = item.name.toLowerCase();
                        return (
                          <SelectItem
                            key={key}
                            value={key}
                            className="rounded-lg [&_span]:flex"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <span
                                className="flex h-3 w-3 shrink-0 rounded-sm"
                                style={{ backgroundColor: item.fill }}
                              />
                              {item.name}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="flex flex-1 justify-center pb-0">
                  <ChartContainer
                    id="status-pie"
                    config={statusChartConfig}
                    className="mx-auto aspect-square w-full max-w-[300px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
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
                              <Sector
                                {...rest}
                                outerRadius={outerRadius + 25}
                                innerRadius={outerRadius + 12}
                              />
                            </g>
                          )
                        }}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {statusData[activeIndex]?.value.toLocaleString() || 0}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    {statusData[activeIndex]?.name}
                                  </tspan>
                                </text>
                              )
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>

                {/* Color Legend */}
                <div className="px-6 pb-4 pt-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-cyan-50/50 border border-cyan-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#00A1B0]"></div>
                        <span className="text-xs font-medium text-gray-700">Completed</span>
                      </div>
                      <span className="text-lg font-bold text-cyan-600">{statusData.find(s => s.name === "Completed")?.value || 0}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                        <span className="text-xs font-medium text-gray-700">Pending</span>
                      </div>
                      <span className="text-lg font-bold text-amber-600">{statusData.find(s => s.name === "Pending")?.value || 0}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-rose-50/50 border border-rose-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#F43F5E]"></div>
                        <span className="text-xs font-medium text-gray-700">Cancelled</span>
                      </div>
                      <span className="text-lg font-bold text-rose-600">{statusData.find(s => s.name === "Cancelled")?.value || 0}</span>
                    </div>
                  </div>
                </div>

                <CardFooter className="flex-col gap-2 text-sm pt-0">
                  <div className="flex items-center gap-2 leading-none font-medium text-gray-900">
                    {completedPercentage}% completion rate <TrendingUp className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="text-gray-500 leading-none text-xs">
                    Total {totalAppointments} appointments in selected range
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Top Doctors Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-800">Top Performing Doctors</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats?.topDoctors?.map((doc: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.appointments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">₹{doc.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {!stats?.topDoctors?.length && (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-gray-400 italic">No data available for this range</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main >
      </div >
    </div >
  );
};

export default Dashboard;
