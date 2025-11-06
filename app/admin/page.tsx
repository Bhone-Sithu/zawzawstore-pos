'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { ReportService, SalesDashboardData, SalesPeriod } from '@/services/report-service'
import { SalesMetrics } from '@/components/dashboard/SalesMetrics'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { BranchComparison } from '@/components/dashboard/BranchComparison'
import { CategorySalesChart } from '@/components/dashboard/CategorySalesChart'
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PrinterSettings } from "@/components/admin/PrinterSettings"
import EmailSettings from "@/components/admin/EmailSettings"
import { BarChart3, TrendingUp, PieChart, Users, RefreshCw, Download, AlertCircle, Settings } from 'lucide-react'

export default function AdminDashboard() {
  const { user, isLoaded } = useUser()
  
  const [salesData, setSalesData] = useState<SalesDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<SalesPeriod>('today')
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [branches, setBranches] = useState<Array<{ id: string; name: string; location: string }>>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchBranches = useCallback(async () => {
    try {
      const branchData = await ReportService.getBranches()
      setBranches(branchData)
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }, [])

  const fetchSalesData = useCallback(async (customStart?: string, customEnd?: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      const data = await ReportService.getSalesData(
        selectedPeriod,
        selectedBranch,
        customStart,
        customEnd
      )
      setSalesData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching sales data:', error)
      setError('Failed to load sales data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedPeriod, selectedBranch])

  useEffect(() => {
    if (isLoaded && user) {
      fetchBranches()
    }
  }, [isLoaded, user, fetchBranches])

  useEffect(() => {
    if (branches.length > 0) {
      fetchSalesData()
    }
  }, [branches, fetchSalesData])

  const handlePeriodChange = (period: SalesPeriod) => {
    setSelectedPeriod(period)
  }

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId)
  }

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    fetchSalesData(startDate, endDate)
  }

  const handleRefresh = () => {
    fetchSalesData()
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} className="bg-orange-500 hover:bg-orange-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Sales analytics and business overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm text-gray-600">
            <p>Last updated</p>
            <p className="font-medium">{lastUpdated.toLocaleTimeString()}</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <DateRangeFilter
        selectedPeriod={selectedPeriod}
        selectedBranch={selectedBranch}
        branches={branches}
        onPeriodChange={handlePeriodChange}
        onBranchChange={handleBranchChange}
        onCustomDateChange={handleCustomDateChange}
        isLoading={isLoading}
      />

      {/* Key Metrics */}
      {salesData && (
        <SalesMetrics metrics={salesData.metrics} isLoading={isLoading} />
      )}

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full lg:w-auto lg:grid-cols-5 bg-white border border-gray-200">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart
              data={salesData?.dailySales || []}
              isLoading={isLoading}
              showProfit={true}
              chartType="bar"
            />
            <RevenueChart
              data={salesData?.dailySales || []}
              isLoading={isLoading}
              showProfit={false}
              chartType="line"
            />
          </div>
          {salesData && (
            <BranchComparison
              data={salesData.branchSales}
              isLoading={isLoading}
              chartType="bar"
            />
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-1">
            <RevenueChart
              data={salesData?.dailySales || []}
              isLoading={isLoading}
              showProfit={true}
              chartType="line"
            />
          </div>
          
          {/* Payment Methods */}
          {salesData && salesData.paymentMethods.length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {salesData.paymentMethods.map((method) => (
                    <div key={method.method} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 capitalize">{method.method}</h4>
                      <p className="text-2xl font-bold text-orange-600 mt-2">
                        {new Intl.NumberFormat('en-MY', {
                          style: 'currency',
                          currency: 'MYR'
                        }).format(method.revenue)}
                      </p>
                      <p className="text-sm text-gray-600">{method.transactions} transactions</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {salesData && (
            <CategorySalesChart
              data={salesData.categorySales}
              isLoading={isLoading}
              chartType="bar"
            />
          )}
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {salesData && salesData.staffPerformance.length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.staffPerformance.map((staff) => (
                    <div key={staff.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('en-MY', {
                            style: 'currency',
                            currency: 'MYR'
                          }).format(staff.totalSales)}
                        </p>
                        <p className="text-sm text-gray-600">{staff.totalTransactions} transactions</p>
                        {staff.staffCheckouts > 0 && (
                          <p className="text-xs text-orange-600">
                            {new Intl.NumberFormat('en-MY', {
                              style: 'currency',
                              currency: 'MYR'
                            }).format(staff.staffCheckouts)} staff items
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <PrinterSettings />
          <EmailSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
