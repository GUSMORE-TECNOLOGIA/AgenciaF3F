import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Toaster } from '@/components/ui/sonner'

export default function AdsLayout() {
  const queryClient = useMemo(() => new QueryClient(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <div className="ads-module min-h-full">
        <Outlet />
      </div>
    </QueryClientProvider>
  )
}
