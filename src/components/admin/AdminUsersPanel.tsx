"use client";

import * as React from "react";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { UsersList } from "@/components/admin/UsersList";

export function AdminUsersPanel() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  return (
    <div className="space-y-6">
      <CreateUserForm onCreated={() => setRefreshKey((k) => k + 1)} />
      <UsersList refreshKey={refreshKey} />
    </div>
  );
}
