"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, List, User } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/tours", label: "My Tours", icon: List },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 shadow-t-lg z-50">
      <div className="container mx-auto max-w-lg">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-6 w-6 mb-1 ${isActive ? "text-primary" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
} 