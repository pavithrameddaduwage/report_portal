'use client'
import AdvancedTable from '@/components/AdvanceTable';
import { useSearchParams } from 'next/navigation';

import React from 'react'

const Page = () => {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");

  return (
    <div>
    <div>Reports {workspaceId}</div>
  
    </div>

  )
}

export default Page