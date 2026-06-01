'use client'
import { Toaster } from 'react-hot-toast'
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ top: 64 }}
      toastOptions={{ style: { fontFamily: 'Inter, system-ui, sans-serif' } }}
    />
  )
}
