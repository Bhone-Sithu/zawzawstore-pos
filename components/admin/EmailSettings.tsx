'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, X, Mail, Save, AlertCircle } from 'lucide-react'
import { EmailService } from '@/services/email-service'

export default function EmailSettings() {
  const [emailRecipients, setEmailRecipients] = useState<string[]>(
    EmailService.getEmailRecipients()
  )
  const [newEmail, setNewEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const addEmail = () => {
    if (newEmail && isValidEmail(newEmail) && !emailRecipients.includes(newEmail)) {
      setEmailRecipients([...emailRecipients, newEmail])
      setNewEmail('')
    }
  }

  const removeEmail = (emailToRemove: string) => {
    setEmailRecipients(emailRecipients.filter(email => email !== emailToRemove))
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addEmail()
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      EmailService.updateEmailRecipients(emailRecipients)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save email settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-orange-600" />
          Email Report Settings
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure email addresses that will receive daily sales reports when cashiers end their shifts.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Recipients */}
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-3 block">
            Current Recipients ({emailRecipients.length})
          </Label>
          
          {emailRecipients.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                No email recipients configured. Daily reports will not be sent.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {emailRecipients.map((email, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Badge variant="outline" className="bg-white">
                    {email}
                  </Badge>
                  <Button
                    onClick={() => removeEmail(email)}
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Add New Email */}
        <div>
          <Label htmlFor="new-email" className="text-sm font-semibold text-gray-700 mb-3 block">
            Add New Recipient
          </Label>
          <div className="flex gap-2">
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="manager@company.com"
              className="flex-1"
            />
            <Button
              onClick={addEmail}
              disabled={!newEmail || !isValidEmail(newEmail) || emailRecipients.includes(newEmail)}
              className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {newEmail && !isValidEmail(newEmail) && (
            <p className="text-sm text-red-600 mt-1">Please enter a valid email address</p>
          )}
          {newEmail && emailRecipients.includes(newEmail) && (
            <p className="text-sm text-yellow-600 mt-1">This email is already in the list</p>
          )}
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Reports are sent automatically when cashiers end their shifts
          </div>
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className={`cursor-pointer ${
              saveSuccess 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-orange-500 hover:bg-orange-600'
            } text-white`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• When a cashier clicks &quot;End Day &amp; Sign Out&quot;, a daily summary is generated</li>
            <li>• The summary includes revenue, profit, transaction details, and a PDF report</li>
            <li>• Email reports are automatically sent to all configured recipients</li>
            <li>• Recipients receive both a summary email and a detailed PDF attachment</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}