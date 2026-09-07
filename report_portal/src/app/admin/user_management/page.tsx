"use client";

import React, { useState } from 'react'
import UserMaster from './user-master'
import ResourceAccess from './resource-access'
import UserAccessView from './user-access-view'
import { Users, Shield, UserCheck } from 'lucide-react';

const Page = () => {
  const [activeTab, setActiveTab] = useState<"user" | "resource" | "user_access">("user");

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Tabs matching wireframe structure */}
      <div className="flex items-center gap-2 border-b border-[#c8dced] pb-1">
        <button
          onClick={() => setActiveTab("user")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${
            activeTab === "user"
              ? "bg-[#1890ff] text-white shadow-xs"
              : "bg-white text-[#2b5278] hover:bg-[#eaf4fd] border border-transparent"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          User Management
        </button>

        <button
          onClick={() => setActiveTab("resource")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${
            activeTab === "resource"
              ? "bg-[#1890ff] text-white shadow-xs"
              : "bg-white text-[#2b5278] hover:bg-[#eaf4fd] border border-transparent"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Workspace & Report Permissions
        </button>

        <button
          onClick={() => setActiveTab("user_access")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${
            activeTab === "user_access"
              ? "bg-[#1890ff] text-white shadow-xs"
              : "bg-white text-[#2b5278] hover:bg-[#eaf4fd] border border-transparent"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          User Access View
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "user" && <UserMaster />}
        {activeTab === "resource" && <ResourceAccess />}
        {activeTab === "user_access" && <UserAccessView />}
      </div>
    </div>
  )
}

export default Page;