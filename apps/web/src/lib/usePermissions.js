"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./auth-context";

export function usePermissions() {
  const { user } = useAuth();
  const [perms, setPerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.role) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/proxy/permissions/roles", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => setPerms(data[user.role] || []))
      .catch(() => setPerms([]))
      .finally(() => setLoading(false));
  }, [user]);

  return { perms, loading };
}
