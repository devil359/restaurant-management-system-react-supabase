
import React from "react";
import { Navigate } from "react-router-dom";

const CRM = () => {
  // For now, we'll redirect to the customers page since that's our existing CRM functionality
  return <Navigate to="/customers" replace />;
};

export default CRM;
