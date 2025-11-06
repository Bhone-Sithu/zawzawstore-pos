import { DailySummary } from './daily-report-service'
import { PDFService } from './pdf-service'

// Email configuration - these should be environment variables
const EMAIL_CONFIG = {
  // Default recipients for daily reports
  recipients: [
    'manager@grocerystore.com',
    'owner@grocerystore.com', 
    'accountant@grocerystore.com'
  ],
  // Email service settings (you would configure these based on your provider)
  apiUrl: process.env.NEXT_PUBLIC_EMAIL_API_URL || '',
  apiKey: process.env.EMAIL_API_KEY || '',
  fromEmail: 'noreply@grocerystore.com',
  fromName: 'Grocery Store POS'
}

export interface EmailAttachment {
  filename: string
  content: string | Blob
  contentType: string
}

export interface EmailData {
  to: string[]
  subject: string
  htmlContent: string
  attachments?: EmailAttachment[]
}

export class EmailService {
  static async sendDailyReport(summary: DailySummary): Promise<boolean> {
    try {
      // Generate PDF attachment
      const pdfBlob = await PDFService.generateDailyReportPDF(summary)
      const pdfContent = await this.blobToBase64(pdfBlob)
      
      const emailData: EmailData = {
        to: EMAIL_CONFIG.recipients,
        subject: `Daily Sales Report - ${summary.branchName} - ${summary.date}`,
        htmlContent: this.generateEmailHTML(summary),
        attachments: [
          {
            filename: `daily-report-${summary.date.replace(/\//g, '-')}.html`,
            content: pdfContent,
            contentType: 'text/html'
          }
        ]
      }

      // Send email using your preferred service
      return await this.sendEmail(emailData)
    } catch (error) {
      console.error('Failed to send daily report email:', error)
      return false
    }
  }

  private static async sendEmail(emailData: EmailData): Promise<boolean> {
    // This is where you would integrate with your email service
    // Examples: Resend, SendGrid, AWS SES, Nodemailer, etc.
    
    console.log('Email would be sent with the following data:', {
      to: emailData.to,
      subject: emailData.subject,
      attachments: emailData.attachments?.length || 0
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // For now, return true to simulate successful sending
    // Replace this with actual email service integration
    return true
  }

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:mime;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private static generateEmailHTML(summary: DailySummary): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR'
      }).format(amount)
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Daily Sales Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            padding: 30px 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .summary-title {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 500;
        }
        .summary-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .summary-subtitle {
            font-size: 12px;
            color: #64748b;
        }
        .revenue { color: #059669; }
        .profit { color: #2563eb; }
        .transactions { color: #ea580c; }
        .other { color: #7c2d12; }
        
        .transaction-summary {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .transaction-summary h3 {
            margin-top: 0;
            color: #1e293b;
        }
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            margin-top: 30px;
        }
        .highlight {
            background: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily Sales Report</h1>
        <p><strong>${summary.branchName}</strong> • ${summary.date}</p>
        <p>Cashier: ${summary.cashierName}</p>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-title">Total Revenue</div>
            <div class="summary-value revenue">${formatCurrency(summary.totalRevenue)}</div>
            <div class="summary-subtitle">${summary.customerTransactions} customer sales</div>
        </div>
        
        <div class="summary-card">
            <div class="summary-title">Total Profit</div>
            <div class="summary-value profit">${formatCurrency(summary.totalProfit)}</div>
            <div class="summary-subtitle">${summary.totalRevenue > 0 ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1) : '0'}% margin</div>
        </div>
        
        <div class="summary-card">
            <div class="summary-title">Transactions</div>
            <div class="summary-value transactions">${summary.totalTransactions}</div>
            <div class="summary-subtitle">Avg: ${formatCurrency(summary.averageOrderValue)}</div>
        </div>
        
        <div class="summary-card">
            <div class="summary-title">Other</div>
            <div class="summary-value other">
                ${summary.staffPurchases + summary.supplierPurchases > 0 ? 
                  formatCurrency(summary.staffPurchases + summary.supplierPurchases) : 
                  'None'
                }
            </div>
            <div class="summary-subtitle">
                ${summary.staffPurchases > 0 || summary.supplierPurchases > 0 ? 'Staff + Supplier' : 'No other transactions'}
            </div>
        </div>
    </div>

    <div class="transaction-summary">
        <h3>Transaction Breakdown</h3>
        <p><strong>Customer Transactions:</strong> ${summary.customerTransactions} (${formatCurrency(summary.totalRevenue)})</p>
        ${summary.staffPurchases > 0 ? `<p><strong>Staff Purchases:</strong> ${formatCurrency(summary.staffPurchases)}</p>` : ''}
        ${summary.supplierPurchases > 0 ? `<p><strong>Supplier Purchases:</strong> ${formatCurrency(summary.supplierPurchases)}</p>` : ''}
        <p><strong>Total Transactions:</strong> ${summary.totalTransactions}</p>
    </div>

    ${summary.totalTransactions === 0 ? 
      '<div class="highlight"><strong>Note:</strong> No transactions were recorded for this cashier today.</div>' : ''
    }

    <div class="footer">
        <p>This report was automatically generated by the Grocery Store POS System</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Please find the detailed transaction report attached as a PDF.</p>
    </div>
</body>
</html>
    `
  }

  // Static method to get configured email recipients
  static getEmailRecipients(): string[] {
    return EMAIL_CONFIG.recipients
  }

  // Static method to update email recipients (you might want to make this configurable via admin panel)
  static updateEmailRecipients(recipients: string[]): void {
    EMAIL_CONFIG.recipients = recipients
  }
}