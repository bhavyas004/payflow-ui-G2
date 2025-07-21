import React from "react";
import DashboardLayout from "../components/DashboardLayout";

const HRDashboard = () => {
  return (
    <DashboardLayout role="HR" title="HR / Manager Dashboard">
      <p className="text-lg text-gray-700">Welcome! You can now onboard new employees.</p>
    </DashboardLayout>
  );
};

export default HRDashboard;
