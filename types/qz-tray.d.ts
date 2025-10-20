declare module 'qz-tray' {
  interface QZWebSocket {
    connect(): Promise<void>
    disconnect(): void
    isActive(): boolean
  }

  interface QZPrinters {
    find(): Promise<string[]>
    getDefault(): Promise<string>
  }

  interface QZConfigs {
    create(printer: string): any
  }

  interface QZPrintData {
    type: 'raw' | 'pixel' | 'html'
    format?: 'command' | 'plain' | 'base64' | 'file' | 'hex'
    data: string | string[]
  }

  interface QZ {
    websocket: QZWebSocket
    printers: QZPrinters
    configs: QZConfigs
    print(config: any, data: QZPrintData[]): Promise<void>
  }

  const qz: QZ
  export default qz
}