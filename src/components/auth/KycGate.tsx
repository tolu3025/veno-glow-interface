import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const KycGate = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // A user is only past the gate once an admin has actually approved Level 1
  // (kyc_level >= 1). Status alone is not enough — it can be set optimistically.
  // The /kyc page itself is outside this gate and renders an "Under Admin Review"
  // state for kyc_status === 'submitted'.
  const isVerified = (profile?.kyc_level ?? 0) >= 1;
  if (profile && !isVerified) {
    return <Navigate to="/kyc" replace />;
  }


  return <>{children}</>;
};

export default KycGate;
