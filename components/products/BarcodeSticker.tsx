'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import type { ProductWithCategory } from '@/services/product-service'

interface BarcodeStickerProps {
  product: ProductWithCategory
  onPrint?: () => void
}

export function BarcodeSticker({ product, onPrint }: BarcodeStickerProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)
  const stickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (barcodeRef.current && product.barcode) {
      JsBarcode(barcodeRef.current, product.barcode, {
        format: "CODE128",
        width: 1,
        height: 30,
        displayValue: true,
        fontSize: 8,
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 2,
        fontOptions: "",
        font: "monospace",
        background: "#ffffff",
        lineColor: "#000000",
        margin: 2
      })
    }
  }, [product.barcode])

  const handlePrint = () => {
    if (stickerRef.current) {
      const printWindow = window.open('', '_blank', 'width=400,height=300,scrollbars=no,resizable=no')
      if (!printWindow) {
        alert('Please allow popups for this site to print stickers')
        return
      }

      const stickerHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barcode Sticker - ${product.name_en}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: Arial, sans-serif;
                background: white;
                padding: 5mm;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .sticker {
                width: 30mm;
                height: 25mm;
                border: 1px solid #000;
                padding: 1mm;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                background: white;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .product-name {
                font-size: 7px;
                font-weight: bold;
                text-align: center;
                line-height: 1.1;
                margin-bottom: 1mm;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                word-wrap: break-word;
                hyphens: auto;
              }
              .price {
                font-size: 8px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 1mm;
                color: #000;
              }
              .barcode-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                flex: 1;
              }
              .barcode-svg {
                max-width: 26mm;
                height: auto;
              }
              @media print {
                body { 
                  margin: 0; 
                  padding: 0;
                  background: white;
                }
                @page { 
                  size: 35mm 30mm;
                  margin: 0;
                }
                .sticker {
                  border: none;
                  margin: 0;
                  padding: 1mm;
                }
              }
              @page {
                size: 35mm 30mm;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div class="sticker">
              <div class="product-name">${product.name_en}</div>
              <div class="price">RM ${product.base_price.toFixed(2)}</div>
              <div class="barcode-container">
                ${stickerRef.current?.querySelector('.barcode-svg')?.outerHTML || ''}
              </div>
            </div>
            
            <script>
              window.print();
              setTimeout(() => window.close(), 500);
            </script>
          </body>
        </html>
      `

      printWindow.document.write(stickerHTML)
      printWindow.document.close()
      onPrint?.()
    }
  }

  return (
    <div ref={stickerRef} className="hidden">
      {/* This is just for generating the barcode SVG */}
      <svg 
        ref={barcodeRef} 
        className="barcode-svg"
      ></svg>
      
      {/* Preview (for development) */}
      <div className="sticker-preview border border-gray-300 p-2 bg-white" style={{ width: '30mm', height: '25mm' }}>
        <div className="text-xs font-bold text-center mb-1 overflow-hidden" style={{ fontSize: '7px', lineHeight: '1.1' }}>
          {product.name_en}
        </div>
        <div className="text-xs font-bold text-center mb-1" style={{ fontSize: '8px' }}>
          RM {product.base_price.toFixed(2)}
        </div>
        <div className="flex justify-center items-center flex-1">
          <svg 
            ref={barcodeRef} 
            className="max-w-full h-auto"
          ></svg>
        </div>
      </div>
      
      <button 
        onClick={handlePrint}
        className="mt-2 px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
      >
        Print Sticker
      </button>
    </div>
  )
}