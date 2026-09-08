"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { findAllusers, findAllRoles } from "@/services/user-service";
import { findAllWorkspaces } from "@/services/workspace-services";
import { findAllDisplayViews } from "@/services/report-service";

interface DataContextType {
  users: any[];
  workspaces: any[];
  roles: any[];
  displayViews: any[];
  loadingUsers: boolean;
  loadingWorkspaces: boolean;
  loadingRoles: boolean;
  loadingDisplayViews: boolean;
  initialLoaded: boolean;
  fetchUsers: (force?: boolean) => Promise<any[]>;
  fetchWorkspaces: (force?: boolean) => Promise<any[]>;
  fetchRoles: (force?: boolean) => Promise<any[]>;
  fetchDisplayViews: (force?: boolean) => Promise<any[]>;
  fetchAllData: (force?: boolean) => Promise<void>;
  setUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setWorkspaces: React.Dispatch<React.SetStateAction<any[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: "rp_cache_users",
  WORKSPACES: "rp_cache_workspaces",
  ROLES: "rp_cache_roles",
  DISPLAY_VIEWS: "rp_cache_display_views",
};

const getStorageItem = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

const setStorageItem = (key: string, value: any) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<any[]>(() => getStorageItem(STORAGE_KEYS.USERS) || []);
  const [workspaces, setWorkspaces] = useState<any[]>(() => getStorageItem(STORAGE_KEYS.WORKSPACES) || []);
  const [roles, setRoles] = useState<any[]>(() => getStorageItem(STORAGE_KEYS.ROLES) || []);
  const [displayViews, setDisplayViews] = useState<any[]>(() => getStorageItem(STORAGE_KEYS.DISPLAY_VIEWS) || []);

  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState<boolean>(false);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(false);
  const [loadingDisplayViews, setLoadingDisplayViews] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);

  // Fetch Users
  const fetchUsers = useCallback(async (force = false) => {
    if (!force && users.length > 0) return users;
    setLoadingUsers(true);
    try {
      const res = await findAllusers();
      const userList = res?.data || res || [];
      if (Array.isArray(userList)) {
        setUsers(userList);
        setStorageItem(STORAGE_KEYS.USERS, userList);
        return userList;
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
    return users;
  }, [users]);

  // Fetch Workspaces
  const fetchWorkspaces = useCallback(async (force = false) => {
    if (!force && workspaces.length > 0) return workspaces;
    setLoadingWorkspaces(true);
    try {
      const res = await findAllWorkspaces();
      const wsList = res?.data || res || [];
      if (Array.isArray(wsList)) {
        setWorkspaces(wsList);
        setStorageItem(STORAGE_KEYS.WORKSPACES, wsList);
        return wsList;
      }
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setLoadingWorkspaces(false);
    }
    return workspaces;
  }, [workspaces]);

  // Fetch Roles
  const fetchRoles = useCallback(async (force = false) => {
    if (!force && roles.length > 0) return roles;
    setLoadingRoles(true);
    try {
      const res = await findAllRoles();
      const roleList = res?.data || res || [];
      if (Array.isArray(roleList)) {
        setRoles(roleList);
        setStorageItem(STORAGE_KEYS.ROLES, roleList);
        return roleList;
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    } finally {
      setLoadingRoles(false);
    }
    return roles;
  }, [roles]);

  // Fetch Display Views
  const fetchDisplayViews = useCallback(async (force = false) => {
    if (!force && displayViews.length > 0) return displayViews;
    setLoadingDisplayViews(true);
    try {
      const res = await findAllDisplayViews();
      const dvList = res?.data || res || [];
      if (Array.isArray(dvList)) {
        setDisplayViews(dvList);
        setStorageItem(STORAGE_KEYS.DISPLAY_VIEWS, dvList);
        return dvList;
      }
    } catch (err) {
      console.error("Failed to fetch display views:", err);
    } finally {
      setLoadingDisplayViews(false);
    }
    return displayViews;
  }, [displayViews]);

  // Fetch All Master Data concurrently
  const fetchAllData = useCallback(async (force = false) => {
    try {
      await Promise.allSettled([
        fetchUsers(force),
        fetchWorkspaces(force),
        fetchRoles(force),
        fetchDisplayViews(force),
      ]);
      setInitialLoaded(true);
    } catch (err) {
      console.error("Error loading master data:", err);
    }
  }, [fetchUsers, fetchWorkspaces, fetchRoles, fetchDisplayViews]);

  // Automatically trigger background fetch on mount if empty
  useEffect(() => {
    const hasData = users.length > 0 && workspaces.length > 0;
    fetchAllData(!hasData);
  }, []);

  return (
    <DataContext.Provider
      value={{
        users,
        workspaces,
        roles,
        displayViews,
        loadingUsers,
        loadingWorkspaces,
        loadingRoles,
        loadingDisplayViews,
        initialLoaded,
        fetchUsers,
        fetchWorkspaces,
        fetchRoles,
        fetchDisplayViews,
        fetchAllData,
        setUsers,
        setWorkspaces,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
