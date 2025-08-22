'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesMetrics as SalesMetricsType } from "@/services/report-service"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Target, BarChart3 } from "lucide-react"

interface SalesMetricsProps {
  metrics: SalesMetricsType
  isLoading?: boolean
}

export function SalesMetrics({ metrics, isLoading }: SalesMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const metricCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total Profit",
      value: formatCurrency(metrics.totalProfit),
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Transactions",
      value: metrics.totalTransactions.toString(),
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Average Order",
      value: formatCurrency(metrics.averageOrderValue),
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Profit Margin",
      value: formatPercentage(metrics.profitMargin),
      icon: BarChart3,
      color: metrics.profitMargin > 30 ? "text-green-600" : metrics.profitMargin > 15 ? "text-yellow-600" : "text-red-600",
      bgColor: metrics.profitMargin > 30 ? "bg-green-100" : metrics.profitMargin > 15 ? "bg-yellow-100" : "bg-red-100"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value}
              </div>
              {metric.title === "Profit Margin" && (
                <p className={`text-xs mt-1 flex items-center ${metric.color}`}>
                  {metrics.profitMargin > 30 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metrics.profitMargin > 30 ? "Excellent" : metrics.profitMargin > 15 ? "Good" : "Needs improvement"}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}