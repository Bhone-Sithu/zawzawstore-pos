import { DailySummary } from './daily-report-service'

export class PDFService {
  static async generateDailyReportPDF(summary: DailySummary): Promise<Blob> {
    const htmlContent = this.generateHTMLContent(summary)
    
    // Return HTML blob - will be used for HTML download
    const blob = new Blob([htmlContent], { type: 'text/html' })
    return blob
  }

  static async printToPDF(summary: DailySummary): Promise<void> {
    const htmlContent = this.generateHTMLContent(summary)
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow pop-ups for this site.')
    }
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load
    await new Promise(resolve => {
      if (printWindow.document.readyState === 'complete') {
        resolve(void 0)
      } else {
        printWindow.onload = () => resolve(void 0)
        setTimeout(() => resolve(void 0), 1000) // fallback timeout
      }
    })
    
    // Use browser's print to PDF functionality
    printWindow.print()
    
    // Close window after a delay to allow print dialog to open
    setTimeout(() => {
      printWindow.close()
    }, 1000)
  }

  static downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  private static generateHTMLContent(summary: DailySummary): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR'
      }).format(amount)
    }

    const formatTime = (dateString: string) => {
      return new Date(dateString).toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Daily Sales Report - ${summary.date}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .report-title {
            font-size: 18px;
            color: #666;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background-color: #f9f9f9;
        }
        .summary-title {
            font-weight: bold;
            color: #555;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
        }
        .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .transactions-table th,
        .transactions-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .transactions-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .transaction-type {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .type-customer {
            background-color: #dcfce7;
            color: #166534;
        }
        .type-staff {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .type-supplier {
            background-color: #fdf4ff;
            color: #7c2d12;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Grocery Store POS</div>
        <div class="report-title">Daily Sales Report</div>
        <div style="margin-top: 10px;">
            <strong>${summary.branchName}</strong> • ${summary.date}
        </div>
        <div style="margin-top: 5px; color: #666;">
            Cashier: ${summary.cashierName}
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-title">Total Revenue</div>
            <div class="summary-value" style="color: #059669;">${formatCurrency(summary.totalRevenue)}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                ${summary.customerTransactions} customer transactions
            </div>
        </div>
        
        <div class="summary-card">
            <div class="summary-title">Total Profit</div>
            <div class="summary-value" style="color: #2563eb;">${formatCurrency(summary.totalProfit)}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                ${summary.totalRevenue > 0 ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1) : '0'}% profit margin
            </div>
        </div>
        
        <div class="summary-card">
            <div class="summary-title">Total Transactions</div>
            <div class="summary-value" style="color: #ea580c;">${summary.totalTransactions}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                Average: ${formatCurrency(summary.averageOrderValue)}
            </div>
        </div>
        
        <div class="summary-card">
            <div class="summary-title">Other Transactions</div>
            <div style="font-size: 14px; margin-top: 5px;">
                ${summary.staffPurchases > 0 ? `<div>Staff: ${formatCurrency(summary.staffPurchases)}</div>` : ''}
                ${summary.supplierPurchases > 0 ? `<div>Supplier: ${formatCurrency(summary.supplierPurchases)}</div>` : ''}
                ${summary.staffPurchases === 0 && summary.supplierPurchases === 0 ? '<div style="color: #666;">None</div>' : ''}
            </div>
        </div>
    </div>

    <h3>Transaction Details</h3>
    ${summary.transactions.length === 0 ? 
      '<p style="color: #666; text-align: center; padding: 20px;">No transactions recorded today.</p>' : 
      `<table class="transactions-table">
        <thead>
            <tr>
                <th>Time</th>
                <th>Transaction #</th>
                <th>Type</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            ${summary.transactions.map(txn => `
                <tr>
                    <td>${formatTime(txn.created_at)}</td>
                    <td style="font-family: monospace;">${txn.transaction_number}</td>
                    <td>
                        <span class="transaction-type ${
                          txn.supplier_checkout ? 'type-supplier' : 
                          txn.staff_checkout ? 'type-staff' : 'type-customer'
                        }">
                            ${txn.supplier_checkout ? 'Supplier' : txn.staff_checkout ? 'Staff' : 'Customer'}
                        </span>
                    </td>
                    <td>${txn.items.length}</td>
                    <td style="text-transform: capitalize;">${txn.payment_method}</td>
                    <td style="font-weight: bold;">${formatCurrency(txn.total_amount)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>`
    }

    <div class="footer">
        <div>Generated on ${new Date().toLocaleString()}</div>
        <div>Grocery Store POS & Inventory Management System</div>
    </div>
</body>
</html>
    `
  }
}