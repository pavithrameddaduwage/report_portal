"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-navy-900 group-[.toaster]:text-white group-[.toaster]:border-navy-700 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-text-400",
          actionButton:
            "group-[.toast]:bg-blue-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-navy-800 group-[.toast]:text-text-400",
          success: "group-[.toaster]:bg-navy-800 group-[.toaster]:text-white group-[.toaster]:border-blue-500",
          error: "group-[.toaster]:bg-red-950 group-[.toaster]:text-white group-[.toaster]:border-red-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
