'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventSales } from '@/lib/hooks/use-event-sales';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { DollarSign, Download, Percent, TrendingUp, Users } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Format price helper
const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export default function SalesDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const eventId = params.id as string;

  const { data: event, isLoading: eventLoading, error: eventError } = useEventDetails(eventId);
  const { data: sales, isLoading: salesLoading, error: salesError } = useEventSales(eventId);

  // Configure TopBar
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Sales Dashboard',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, clearRoute, pathname, setTopBarForRoute]);

  const handleExportCSV = () => {
    if (!sales) return;

    // Create CSV content
    const headers = ['Ticket Type', 'Sold', 'Total', 'Revenue (sats)'];
    const rows = sales.ticketsByType.map((t) => [t.name, t.sold, t.total, t.revenueSats]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-${eventId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('CSV exported');
  };

  const isLoading = eventLoading || salesLoading;

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-4 p-4'>
          <div className='grid grid-cols-2 gap-4'>
            <Skeleton className='h-24 rounded-xl' />
            <Skeleton className='h-24 rounded-xl' />
          </div>
          <Skeleton className='h-48 rounded-xl' />
          <Skeleton className='h-32 rounded-xl' />
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>
            The event you&apos;re trying to view doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (salesError) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='flex min-h-[50vh] items-center justify-center'>
          <div className='text-center'>
            <h1 className='mb-2 text-xl font-bold text-gray-900'>Unable to Load Sales Data</h1>
            <p className='mb-4 text-gray-600'>There was an error loading sales information.</p>
            <button
              onClick={() => router.back()}
              className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      <div className='space-y-6 p-4'>
        {/* Hero Stats */}
        <div className='grid grid-cols-2 gap-4'>
          <StatCard
            icon={TrendingUp}
            label='Total Revenue'
            value={
              sales?.totalRevenueSats ? `${sales.totalRevenueSats.toLocaleString()} sats` : '0 sats'
            }
            subvalue={
              sales?.totalRevenueFiat != null
                ? formatPrice(sales.totalRevenueFiat, sales.currency)
                : undefined
            }
            color='green'
          />
          <StatCard
            icon={Users}
            label='Tickets Sold'
            value={sales?.ticketsSold?.toString() || '0'}
            color='blue'
          />
        </div>

        {/* Ticket Type Breakdown */}
        {sales && sales?.ticketsByType?.length > 0 && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium'>Ticket Types</h3>
              <Button
                variant='outline'
                size='sm'
                onClick={handleExportCSV}
                className='rounded-full'
              >
                <Download className='mr-2 h-4 w-4' />
                Export CSV
              </Button>
            </div>

            <div className='space-y-3'>
              {sales.ticketsByType.map((type) => {
                const percentage = type.total > 0 ? Math.round((type.sold / type.total) * 100) : 0;
                return (
                  <div key={type.ticketTypeId} className='rounded-xl border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                      <span className='font-medium'>{type.name}</span>
                      <span className='text-sm text-gray-500'>
                        {type.sold}/{type.total}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100'>
                      <div
                        className='h-full rounded-full bg-green-500 transition-all'
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className='mt-1 flex items-center justify-between text-xs text-gray-500'>
                      <span>{percentage}% sold</span>
                      <span>{type.revenueSats.toLocaleString()} sats</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Discount Code Usage */}
        {sales && sales?.discountUsage?.length > 0 && (
          <div className='space-y-4'>
            <h3 className='text-lg font-medium'>Discount Codes</h3>

            <div className='space-y-2'>
              {sales.discountUsage.map((discount) => (
                <div
                  key={discount.code}
                  className='flex items-center justify-between rounded-lg border border-gray-200 p-3'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                      <Percent className='h-4 w-4 text-gray-600' />
                    </div>
                    <div>
                      <p className='font-mono text-sm font-medium'>{discount.code}</p>
                      <p className='text-xs text-gray-500'>{discount.percentage}% off</p>
                    </div>
                  </div>
                  <span className='text-sm text-gray-600'>
                    {discount.used}/{discount.limit} used
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sales Chart placeholder - could add a chart library later */}
        {sales && sales?.salesByDay?.length > 0 && (
          <div className='space-y-4'>
            <h3 className='text-lg font-medium'>Sales Over Time</h3>
            <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
              <div className='flex h-32 items-end gap-1'>
                {sales.salesByDay.map((day, i) => {
                  const maxCount = Math.max(...sales.salesByDay.map((d) => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  return (
                    <div
                      key={day.date}
                      className='flex-1 rounded-t bg-green-500'
                      style={{ height: `${Math.max(4, height)}%` }}
                      title={`${day.date}: ${day.count} sales`}
                    />
                  );
                })}
              </div>
              <div className='mt-2 flex justify-between text-xs text-gray-500'>
                <span>{sales.salesByDay[0]?.date}</span>
                <span>{sales.salesByDay[sales.salesByDay.length - 1]?.date}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {sales && sales.ticketsSold === 0 && (
          <div className='rounded-xl bg-gray-50 p-8 text-center'>
            <DollarSign className='mx-auto h-10 w-10 text-gray-300' />
            <p className='mt-2 text-gray-500'>No sales yet</p>
            <p className='text-sm text-gray-400'>
              Sales data will appear here once tickets are sold
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subvalue?: string;
  color: 'green' | 'blue' | 'amber';
}

function StatCard({ icon: Icon, label, value, subvalue, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className='rounded-xl border border-gray-200 p-4'>
      <div className={`mb-2 inline-flex rounded-full p-2 ${colorClasses[color]}`}>
        <Icon className='h-5 w-5' />
      </div>
      <p className='text-sm text-gray-500'>{label}</p>
      <p className='text-xl font-bold'>{value}</p>
      {subvalue && <p className='text-sm text-gray-500'>{subvalue}</p>}
    </div>
  );
}
