import { CheckCircle, XCircle } from 'lucide-react'

interface AlertMessageProps {
  type: 'success' | 'error'
  message: string
}

export function AlertMessage({ type, message }: AlertMessageProps) {
  return (
    <div
      className={`rounded-lg p-4 mb-6 flex items-center ${
        type === 'success'
          ? 'bg-green-50 text-green-800'
          : 'bg-red-50 text-red-800'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 mr-3" />
      ) : (
        <XCircle className="h-5 w-5 mr-3" />
      )}
      <span>{message}</span>
    </div>
  )
} 