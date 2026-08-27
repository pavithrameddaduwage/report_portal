'use client';

import React, { useEffect, useState } from 'react';
import ReportSchedulerView from './report-scheduler-view';
import { getUserPermissions, UserPermissions } from '@/lib/permissions';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const Page = () => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);

  useEffect(() => {
    setPermissions(getUserPermissions());
  }, []);

  if (permissions === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xs text-[#5c7f9f]">Loading permissions...</div>
      </div>
    );
  }

  if (!permissions.canScheduleReports) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-6 text-center bg-white rounded-xl border border-[#dce6f1] shadow-2xs">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#0a1c30] mb-1">Access Restricted</h2>
        <p className="text-xs text-[#5c7f9f] max-w-md mb-6 leading-relaxed">
          You do not have the <span className="font-semibold text-[#0a1c30]">&quot;Report Scheduler & Automation&quot;</span> privilege assigned to your role. Please contact an administrator to grant you access.
        </p>
        <Link
          href="/workspaces"
          className="px-4 py-2 bg-[#0e2947] hover:bg-[#163e6b] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Return to Workspaces
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ReportSchedulerView />
    </div>
  );
};

export default Page;
