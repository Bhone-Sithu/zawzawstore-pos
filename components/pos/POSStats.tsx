'use client'

import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, ShoppingCart, Clock, TrendingUp } from 'lucide-react'

export default function POSStats() {
  // TODO: Get real data from API
  const stats = {
    todaysSales: 1247.50,
    transactions: 23,
    shiftHours: 6.5,
    avgTransaction: 54.24
  }

  const statCards = [
    {
      title: "Today's Sales",
      value: `RM ${stats.todaysSales.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: '+12.5%'
    },
    {
      title: "Transactions",
      value: stats.transactions.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      trend: '+8'
    },
    {
      title: "Shift Hours",
      value: `${stats.shiftHours}h`,
      icon: Clock,
      color: 'bg-purple-500',
      trend: '6.5h'
    },
    {
      title: "Avg Transaction",
      value: `RM ${stats.avgTransaction.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      trend: '+5.2%'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}