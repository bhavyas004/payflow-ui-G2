import React from "react";
import DashboardLayout from "../components/DashboardLayout";

const ManagerDashboard = () => {
  return (
    <DashboardLayout role="Manager" title="HR / Manager Dashboard">
      <p className="text-lg text-gray-700">Welcome! You can now onboard new employees.</p>
    </DashboardLayout>
  );
};

export default ManagerDashboard;