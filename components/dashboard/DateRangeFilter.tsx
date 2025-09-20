'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { SalesPeriod } from "@/services/report-service"
import { CalendarDays, Filter } from 'lucide-react'

interface DateRangeFilterProps {
  selectedPeriod: SalesPeriod
  selectedBranch: string
  branches: Array<{ id: string; name: string; location: string }>
  onPeriodChange: (period: SalesPeriod) => void
  onBranchChange: (branchId: string) => void
  onCustomDateChange?: (startDate: string, endDate: string) => void
  isLoading?: boolean
}

export function DateRangeFilter({
  selectedPeriod,
  selectedBranch,
  branches,
  onPeriodChange,
  onBranchChange,
  onCustomDateChange,
  isLoading
}: DateRangeFilterProps) {
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomDates, setShowCustomDates] = useState(false)

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const handlePeriodChange = (period: SalesPeriod) => {
    onPeriodChange(period)
    setShowCustomDates(period === 'custom')
  }

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate && onCustomDateChange) {
      onCustomDateChange(customStartDate, customEndDate)
    }
  }

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
          {/* Period Filter */}
          <div className="flex-1 min-w-48">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
            <label className="text-sm font-medium text-gray-700 mb-2 block items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Time Period
            </label>
            <Select value={selectedPeriod} onValueChange={handlePeriodChange} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch Filter */}
          <div className="flex-1 min-w-48">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Branch
            </label>
            <Select value={selectedBranch} onValueChange={onBranchChange} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name} - {branch.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {showCustomDates && (
            <>
              <div className="flex-1 min-w-32">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              <div className="flex-1 min-w-32">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleCustomDateSubmit}
                disabled={!customStartDate || !customEndDate || isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6"
              >
                Apply
              </Button>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Selected: {periods.find(p => p.value === selectedPeriod)?.label}</span>
            <span>Branch: {selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.id === selectedBranch)?.name}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}