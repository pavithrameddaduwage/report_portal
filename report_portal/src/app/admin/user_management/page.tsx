"use client";

import React, { useState } from 'react'
import UserMaster from './user-master'
import ResourceAccess from './resource-access'

const Page = () => {
  const [activeTab, setActiveTab] = useState<"user" | "resource">("user");

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#c8dced] pb-2">
        <button
          onClick={() => setActiveTab("user")}
          className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors ${
            activeTab === "user"
              ? "bg-[#1890ff] text-white"
              : "bg-white text-[#2b5278] hover:bg-[#eaf4fd] border border-transparent"
          }`}
        >
          Assign by User
        </button>
        <button
          onClick={() => setActiveTab("resource")}
          className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors ${
            activeTab === "resource"
              ? "bg-[#1890ff] text-white"
              : "bg-white text-[#2b5278] hover:bg-[#eaf4fd] border border-transparent"
          }`}
        >
          Assign by Resource
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "user" ? <UserMaster /> : <ResourceAccess />}
      </div>
    </div>
  )
}

export default Page