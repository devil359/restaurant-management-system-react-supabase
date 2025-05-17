
import { Navigate } from "react-router-dom";

interface GuardProps {
  children: JSX.Element;
}

/**
 * Prevents authenticated users from accessing login/register pages
 */
export const LoginRegisterAccessGuard: React.FC<GuardProps> = ({ children }) => {
  const user = localStorage.getItem("sb-user");
  if (user) {
    return <Navigate to="/" />;
  }
  return children;
};

/**
 * Prevents unauthenticated users from accessing protected pages
 */
export const ComponentAccessGuard: React.FC<GuardProps> = ({ children }) => {
  const user = localStorage.getItem("sb-user");
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return children;
};
