import QueryProvider from '@/components/QueryProvider'
import React, { ReactNode } from 'react'

const Layout = ({children}:{children:ReactNode}) => {
  return (
    <QueryProvider>{children}</QueryProvider>
  )
}

export default Layout