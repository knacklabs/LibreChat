import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Skeleton } from "~/components/ui/skeleton"
import { ChevronRight, Settings, Mail, Phone, MapPin, Link2, Clock, Briefcase, BadgeCheck, Download, User, CalendarDays, TrendingUp, Zap, Coins, MessageSquare, CheckCircle, XCircle, RefreshCw, Calendar } from "lucide-react"
import { useUser, useUsage } from "~/hooks"
import { useEffect, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import type { ContextType } from "~/common"
import { OpenSidebar } from "~/components/Chat/Menus"
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"



// Get current month start and end dates
const getCurrentMonthDates = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
    };
};

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

// Format number
const formatNumber = (num: number) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
}

const MetricCard = ({ title, value, icon, trend, trendUp }: MetricCardProps) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {trend && (
                        <p className={`text-xs flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                            <TrendingUp className={`h-3 w-3 ${trendUp ? '' : 'rotate-180'}`} />
                            {trend}
                        </p>
                    )}
                </div>
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    {icon}
                </div>
            </div>
        </CardContent>
    </Card>
);

const MetricCardSkeleton = () => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
        </CardContent>
    </Card>
);


// Skeleton component for profile card
const ProfileCardSkeleton = () => (
    <Card>
        <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                    <Skeleton className="size-16 sm:size-20 rounded-full" />
                    <div className="text-center space-y-2">
                        <Skeleton className="h-6 w-32 mx-auto" />
                        <Skeleton className="h-4 w-24 mx-auto" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-1">
                            <Skeleton className="h-5 w-8 mx-auto" />
                            <Skeleton className="h-3 w-12 mx-auto" />
                        </div>
                    ))}
                </div>
                <div className="space-y-2 sm:space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-3">
                            <Skeleton className="size-4 flex-shrink-0" />
                            <Skeleton className="h-4 flex-1" />
                        </div>
                    ))}
                </div>
            </div>
        </CardContent>
    </Card>
);

// Skeleton component for activity card
const ActivityCardSkeleton = () => (
    <Card>
        <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Skeleton className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-full" />
                            {i === 1 && <Skeleton className="h-8 w-24" />}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

// Skeleton component for transaction card
const TransactionCardSkeleton = () => (
    <Card>
        <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-3 border-b last:border-0">
                        <div className="flex-1 min-w-0 space-y-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

// Skeleton component for connections card
const ConnectionsCardSkeleton = () => (
    <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 pb-3 sm:pb-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-8 sm:size-9 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-20" />
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

export default function ProfilePage() {
    const { userData, isLoading, isAuthenticated } = useUser();
    const navigate = useNavigate();
    const { setNavVisible, navVisible } = useOutletContext<ContextType>();

    // Usage dashboard state
    const [customStartDate, setCustomStartDate] = useState<string>("");
    const [customEndDate, setCustomEndDate] = useState<string>("");
    const [useCustomDates, setUseCustomDates] = useState(false);

    const { startDate, endDate } = getCurrentMonthDates();
    const { usageData, isLoading: usageLoading, error: usageError, refetch } = useUsage(
        useCustomDates && customStartDate ? customStartDate : startDate,
        useCustomDates && customEndDate ? customEndDate : endDate
    );

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isLoading, isAuthenticated, navigate]);

    // Show loading skeleton while authenticating
    if (isLoading) {
        return (
            <main className="flex h-full flex-col overflow-y-auto bg-white dark:bg-zinc-900">
                <div className="flex-1">
                    <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl">
                        <div className="space-y-4 lg:space-y-6">
                            {/* Header skeleton */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                <Skeleton className="h-7 w-32" />
                                <Skeleton className="h-9 w-24" />
                            </div>

                            <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-3">
                                {/* Left Column */}
                                <div className="lg:col-span-1 space-y-4 lg:space-y-6">
                                    <ProfileCardSkeleton />
                                    <Card>
                                        <CardHeader className="pb-2 sm:pb-6">
                                            <Skeleton className="h-5 w-40" />
                                        </CardHeader>
                                        <CardContent className="flex items-center gap-3 sm:gap-4">
                                            <Skeleton className="flex-1 h-2" />
                                            <Skeleton className="h-4 w-8" />
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2 sm:pb-6">
                                            <Skeleton className="h-5 w-16" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                                    <Skeleton key={i} className="h-6 w-16" />
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column */}
                                <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                                    <ActivityCardSkeleton />

                                    <div className="grid gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2">
                                        <TransactionCardSkeleton />
                                        <ConnectionsCardSkeleton />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Don't render anything if not authenticated (will redirect)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <main className="flex h-full flex-col overflow-y-auto bg-white dark:bg-zinc-900">
            <div className="flex-1 relative">
                <div className="absolute left-4 top-4 z-10">
                    {!navVisible && <OpenSidebar setNavVisible={setNavVisible} className="max-md:hidden" />}
                </div>
                <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl">
                    <div className="space-y-4 lg:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <h1 className="text-xl font-bold lg:text-2xl text-gray-900 dark:text-gray-100">Usage Analytics</h1>
                        </div>

                        <div className="space-y-4 lg:space-y-6">
                            {/* Usage Analytics - Full Width */}
                            {/* Usage Analytics */}
                            <div className="space-y-6">
                                {usageError ? (
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-4">
                                                <p className="text-red-600">Failed to load usage data: {usageError}</p>
                                                <Button onClick={refetch} variant="outline" className="dark:text-gray-100">
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    Retry
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : usageLoading || !usageData ? (
                                    <div className="space-y-6">
                                        {/* Header Skeleton */}
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-8 w-48" />
                                            <Skeleton className="h-10 w-32" />
                                        </div>

                                        {/* Metrics Cards Skeleton */}
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <MetricCardSkeleton key={i} />
                                            ))}
                                        </div>

                                        {/* Charts Skeleton */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <Card>
                                                <CardHeader>
                                                    <Skeleton className="h-6 w-32" />
                                                </CardHeader>
                                                <CardContent>
                                                    <Skeleton className="h-64 w-full" />
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader>
                                                    <Skeleton className="h-6 w-32" />
                                                </CardHeader>
                                                <CardContent>
                                                    <Skeleton className="h-64 w-full" />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                ) : (() => {
                                    // Prepare chart data
                                    const dailySpendData = usageData.results.map(day => ({
                                        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                        spend: day.metrics.spend,
                                        tokens: day.metrics.total_tokens,
                                        requests: day.metrics.api_requests,
                                    }));

                                    // Prepare model usage data for pie chart
                                    const modelUsage = Object.entries(
                                        usageData.results.reduce((acc, day) => {
                                            Object.entries(day.breakdown.models).forEach(([model, data]) => {
                                                if (!acc[model]) {
                                                    acc[model] = { spend: 0, requests: 0 };
                                                }
                                                acc[model].spend += data.metrics.spend;
                                                acc[model].requests += data.metrics.api_requests;
                                            });
                                            return acc;
                                        }, {} as Record<string, { spend: number; requests: number }>)
                                    ).map(([model, data]) => ({
                                        name: model,
                                        value: data.requests,
                                        spend: data.spend,
                                    }));

                                    const totalMetrics = usageData.metadata;

                                    return (
                                        <div className="space-y-6">
                                            {/* Usage Analytics Content */}
                                            {/* Header */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-muted-foreground text-gray-600 dark:text-gray-400">
                                                            Your API usage for {useCustomDates && customStartDate && customEndDate
                                                                ? `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`
                                                                : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <Button onClick={refetch} variant="outline" size="sm" className="dark:text-gray-100">
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Refresh
                                                    </Button>
                                                </div>

                                                {/* Date Range Controls */}
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Button
                                                                    variant={useCustomDates ? "outline" : "default"}
                                                                    size="sm"
                                                                    onClick={() => setUseCustomDates(false)}
                                                                >
                                                                    Current Month
                                                                </Button>
                                                                <Button
                                                                    variant={useCustomDates ? "default" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => setUseCustomDates(true)}
                                                                >
                                                                    <Calendar className="h-4 w-4 mr-2" />
                                                                    Custom Range
                                                                </Button>
                                                            </div>

                                                            {useCustomDates && (
                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                                                    <div className="flex items-center gap-2">
                                                                        <Label htmlFor="start-date" className="text-sm">From:</Label>
                                                                        <Input
                                                                            id="start-date"
                                                                            type="date"
                                                                            value={customStartDate}
                                                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                                                            className="w-32"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Label htmlFor="end-date" className="text-sm">To:</Label>
                                                                        <Input
                                                                            id="end-date"
                                                                            type="date"
                                                                            value={customEndDate}
                                                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                                                            className="w-32"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Metrics Cards */}
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                <MetricCard
                                                    title="Total Spend"
                                                    value={formatCurrency(totalMetrics.total_spend)}
                                                    icon={<Coins className="h-4 w-4 text-green-600" />}
                                                />
                                                <MetricCard
                                                    title="Total Tokens"
                                                    value={formatNumber(totalMetrics.total_tokens)}
                                                    icon={<Zap className="h-4 w-4 text-yellow-600" />}
                                                />
                                                <MetricCard
                                                    title="API Requests"
                                                    value={formatNumber(totalMetrics.total_api_requests)}
                                                    icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
                                                />
                                                <MetricCard
                                                    title="Success Rate"
                                                    value={`${totalMetrics.total_api_requests > 0
                                                        ? Math.round((totalMetrics.total_successful_requests / totalMetrics.total_api_requests) * 100)
                                                        : 0}%`}
                                                    icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                                                />
                                            </div>

                                            {/* Charts */}
                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                                                {/* Daily Spend Chart */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <TrendingUp className="h-5 w-5" />
                                                            Daily Spend Trend
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <AreaChart data={dailySpendData}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="date" />
                                                                <YAxis tickFormatter={formatCurrency} />
                                                                <Tooltip
                                                                    formatter={(value: number) => [formatCurrency(value), 'Spend']}
                                                                    labelFormatter={(label) => `Date: ${label}`}
                                                                />
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="spend"
                                                                    stroke="#8884d8"
                                                                    fill="#8884d8"
                                                                    fillOpacity={0.6}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>

                                                {/* Model Usage Pie Chart */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <MessageSquare className="h-5 w-5" />
                                                            Model Usage Distribution
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <PieChart>
                                                                <Pie
                                                                    data={modelUsage}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    labelLine={false}
                                                                    label={({ name, percent }) => `${name?.split('/').pop() || name}: ${((percent as number) * 100).toFixed(0)}%`}
                                                                    outerRadius={80}
                                                                    fill="#8884d8"
                                                                    dataKey="value"
                                                                >
                                                                    {modelUsage.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip formatter={(value: number) => [value, 'Requests']} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>

                                                {/* Daily Requests Chart */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <CheckCircle className="h-5 w-5" />
                                                            Daily Requests
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={dailySpendData}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="date" />
                                                                <YAxis />
                                                                <Tooltip
                                                                    formatter={(value: number) => [value, 'Requests']}
                                                                    labelFormatter={(label) => `Date: ${label}`}
                                                                />
                                                                <Bar dataKey="requests" fill="#82ca9d" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>

                                                {/* Token Usage Chart */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <Zap className="h-5 w-5" />
                                                            Daily Token Usage
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <LineChart data={dailySpendData}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="date" />
                                                                <YAxis tickFormatter={formatNumber} />
                                                                <Tooltip
                                                                    formatter={(value: number) => [formatNumber(value), 'Tokens']}
                                                                    labelFormatter={(label) => `Date: ${label}`}
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="tokens"
                                                                    stroke="#ff7300"
                                                                    strokeWidth={2}
                                                                    dot={{ fill: '#ff7300' }}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Summary Stats */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <CalendarDays className="h-5 w-5" />
                                                        Monthly Summary
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium text-muted-foreground">Prompt Tokens</p>
                                                            <p className="text-2xl font-bold">{formatNumber(totalMetrics.total_prompt_tokens)}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium text-muted-foreground">Completion Tokens</p>
                                                            <p className="text-2xl font-bold">{formatNumber(totalMetrics.total_completion_tokens)}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium text-muted-foreground">Cache Tokens</p>
                                                            <p className="text-2xl font-bold">
                                                                {formatNumber(totalMetrics.total_cache_read_input_tokens + totalMetrics.total_cache_creation_input_tokens)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
