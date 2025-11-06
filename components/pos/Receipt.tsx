'use client'

import { forwardRef } from 'react'

interface ReceiptItem {
  name_en: string
  name_mm: string
  quantity: number
  price: number
  total: number
}

interface ReceiptData {
  transactionNumber: string
  date: string
  time: string
  branchName: string
  cashierName: string
  items: ReceiptItem[]
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  change: number
  paymentMethod: string
  checkoutMode: 'customer' | 'staff' | 'supplier'
}

interface ReceiptProps {
  data: ReceiptData
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ data }, ref) => {
  return (
    <div ref={ref} className="receipt-container" style={{ display: 'none' }}>
      <div className="receipt" style={{
        width: '300px',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.2',
        color: '#000',
        backgroundColor: '#fff',
        padding: '10px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <h1 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            margin: '0 0 5px 0',
            textTransform: 'uppercase'
          }}>
            GROCERY STORE
          </h1>
          <div style={{ fontSize: '11px', marginBottom: '3px' }}>
            {data.branchName}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            POS & Inventory Management
          </div>
        </div>

        {/* Transaction Info */}
        <div style={{ marginBottom: '15px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Receipt #:</span>
            <span style={{ fontWeight: 'bold' }}>{data.transactionNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Date:</span>
            <span>{data.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Time:</span>
            <span>{data.time}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Cashier:</span>
            <span>{data.cashierName}</span>
          </div>
          {data.checkoutMode !== 'customer' && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '5px',
              padding: '3px',
              backgroundColor: data.checkoutMode === 'staff' ? '#f0f0f0' : '#f5f0ff',
              border: `1px solid ${data.checkoutMode === 'staff' ? '#ccc' : '#c084fc'}`,
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {data.checkoutMode === 'staff' ? 'STAFF PURCHASE' : 'SUPPLIER CHECKOUT'}
            </div>
          )}
        </div>

        {/* Items */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontWeight: 'bold',
            borderBottom: '1px solid #000',
            paddingBottom: '3px',
            marginBottom: '8px'
          }}>
            <span>ITEM</span>
            <span>QTY</span>
            <span>PRICE</span>
            <span>TOTAL</span>
          </div>
          
          {data.items.map((item, index) => (
            <div key={`${item.name_en}-${index}`} style={{ marginBottom: '8px' }}>
              <div style={{ 
                fontSize: '11px',
                fontWeight: 'bold',
                marginBottom: '1px'
              }}>
                {item.name_en}
              </div>
              <div style={{ 
                fontSize: '10px',
                color: '#666',
                marginBottom: '2px'
              }}>
                {item.name_mm}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '10px'
              }}>
                <span style={{ width: '40%' }} />
                <span style={{ width: '15%', textAlign: 'center' }}>{item.quantity}</span>
                <span style={{ width: '20%', textAlign: 'right' }}>RM {item.price.toFixed(2)}</span>
                <span style={{ width: '25%', textAlign: 'right', fontWeight: 'bold' }}>
                  RM {item.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            <span>TOTAL:</span>
            <span>RM {data.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div style={{ marginBottom: '15px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Payment Method:</span>
            <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{data.paymentMethod}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Amount Paid:</span>
            <span style={{ fontWeight: 'bold' }}>RM {data.amountPaid.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Change:</span>
            <span style={{ fontWeight: 'bold' }}>RM {data.change.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#666' }}>
          <div style={{ marginBottom: '5px' }}>
            Thank you for your purchase!
          </div>
          <div style={{ marginBottom: '5px' }}>
            Please keep this receipt for your records
          </div>
          <div style={{ marginBottom: '10px' }}>
            Visit us again soon!
          </div>
          <div style={{ fontSize: '9px', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
            Generated by Grocery Store POS System
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          * {
            visibility: hidden !important;
          }
          
          .receipt-container {
            display: block !important;
            visibility: visible !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            z-index: 9999 !important;
          }
          
          .receipt-container * {
            visibility: visible !important;
          }
          
          .receipt {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 10px !important;
            font-size: 10px !important;
            background: white !important;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
})

Receipt.displayName = 'Receipt'

export default Receipt