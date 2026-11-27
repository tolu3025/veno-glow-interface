import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import KycGate from "@/components/auth/KycGate";
import AppShell from "./components/layout/AppShell";
import { lazy, Suspense } from "react";
import KukaPayLoader from "@/components/shared/KukaPayLoader";
import OfflineGate from "@/components/shared/OfflineGate";

// Retry wrapper for lazy imports — handles stale chunk errors after HMR/deploy
function lazyRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch(() => {
      // Retry once after a brief delay (handles stale chunk references)
      return new Promise<any>((resolve, reject) => {
        setTimeout(() => {
          importFn()
            .then(resolve)
            .catch(() => {
              // If retry also fails, force a full page reload to get fresh assets
              const hasReloaded = sessionStorage.getItem("chunk_reload");
              if (!hasReloaded) {
                sessionStorage.setItem("chunk_reload", "1");
                window.location.reload();
              } else {
                sessionStorage.removeItem("chunk_reload");
                reject(new Error("Failed to load page after retry and reload."));
              }
            });
        }, 1500);
      });
    })
  );
}

// Lazy load all pages with retry
const Index = lazyRetry(() => import("./pages/Index"));
const SendPage = lazyRetry(() => import("./pages/SendPage"));
const TransferSuccessPage = lazyRetry(() => import("./pages/TransferSuccessPage"));
const CollectPage = lazyRetry(() => import("./pages/CollectPage"));
const ServicesPage = lazyRetry(() => import("./pages/ServicesPage"));
const ProfilePage = lazyRetry(() => import("./pages/ProfilePage"));
const LoginPage = lazyRetry(() => import("./pages/LoginPage"));
const OnboardingPage = lazyRetry(() => import("./pages/OnboardingPage"));
const RegisterPage = lazyRetry(() => import("./pages/RegisterPage"));
const ConfirmEmailPage = lazyRetry(() => import("./pages/ConfirmEmailPage"));

const TermsPage = lazyRetry(() => import("./pages/TermsPage"));
const PrivacyConsentPage = lazyRetry(() => import("./pages/PrivacyConsentPage"));
const RefundPolicyPage = lazyRetry(() => import("./pages/RefundPolicyPage"));
const ForgotPasswordPage = lazyRetry(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazyRetry(() => import("./pages/ResetPasswordPage"));
const AuthConfirmPage = lazyRetry(() => import("./pages/AuthConfirmPage"));
const KycPage = lazyRetry(() => import("./pages/KycPage"));
const KycGuidePage = lazyRetry(() => import("./pages/KycGuidePage"));

const AddMoneyPage = lazyRetry(() => import("./pages/AddMoneyPage"));
const CreateCollectionPage = lazyRetry(() => import("./pages/CreateCollectionPage"));
const PayCollectionPage = lazyRetry(() => import("./pages/PayCollectionPage"));
const WithdrawalPage = lazyRetry(() => import("./pages/WithdrawalPage"));
const CryptoConvertPage = lazyRetry(() => import("./pages/CryptoConvertPage"));
const ErrandsPage = lazyRetry(() => import("./pages/ErrandsPage"));
const PostErrandPage = lazyRetry(() => import("./pages/PostErrandPage"));
const AirtimePage = lazyRetry(() => import("./pages/AirtimePage"));
const AjoPage = lazyRetry(() => import("./pages/AjoPage"));
const CreateAjoPage = lazyRetry(() => import("./pages/CreateAjoPage"));
const AjoDetailPage = lazyRetry(() => import("./pages/AjoDetailPage"));
const EventsPage = lazyRetry(() => import("./pages/EventsPage"));
const CreateEventPage = lazyRetry(() => import("./pages/CreateEventPage"));
const EventDetailPage = lazyRetry(() => import("./pages/EventDetailPage"));
const TicketViewPage = lazyRetry(() => import("./pages/TicketViewPage"));
const ScanTicketPage = lazyRetry(() => import("./pages/ScanTicketPage"));
const EventDashboardPage = lazyRetry(() => import("./pages/EventDashboardPage"));
const InstallPage = lazyRetry(() => import("./pages/InstallPage"));
const ExternalMerchantRedirect = lazyRetry(() => import("./components/shared/ExternalMerchantRedirect"));
const MerchantDirectoryPage = lazyRetry(() => import("./pages/MerchantDirectoryPage"));
const MerchantPayPage = lazyRetry(() => import("./pages/MerchantPayPage"));
const MerchantStorePage = lazyRetry(() => import("./pages/MerchantStorePage"));
// Admin pages removed from user app (separately deployed admin portal)
const TransactionsPage = lazyRetry(() => import("./pages/TransactionsPage"));
const AjoInvitePage = lazyRetry(() => import("./pages/AjoInvitePage"));
const SavingsPage = lazyRetry(() => import("./pages/SavingsPage"));
const RunnerRegistrationPage = lazyRetry(() => import("./pages/RunnerRegistrationPage"));
const RideBookingPage = lazyRetry(() => import("./pages/RideBookingPage"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const WalletPage = lazyRetry(() => import("./pages/WalletPage"));
const SetLoginPinPage = lazyRetry(() => import("./pages/SetLoginPinPage"));
const SessionsPage = lazyRetry(() => import("./pages/security/SessionsPage"));
const RequestServicePage = lazyRetry(() => import("./pages/services/RequestServicePage"));
const ServiceRequestsPage = lazyRetry(() => import("./pages/services/ServiceRequestsPage"));
const ServiceRequestDetailPage = lazyRetry(() => import("./pages/services/ServiceRequestDetailPage"));
const PrintingDirectoryPage = lazyRetry(() => import("./pages/services/PrintingDirectoryPage"));
const PrintingCheckoutPage = lazyRetry(() => import("./pages/services/PrintingCheckoutPage"));
const LaundryDirectoryPage = lazyRetry(() => import("./pages/services/LaundryDirectoryPage"));
const LaundryCheckoutPage = lazyRetry(() => import("./pages/services/LaundryCheckoutPage"));
const FoodDirectoryPage = lazyRetry(() => import("./pages/services/FoodDirectoryPage"));
const OrderConfirmationPage = lazyRetry(() => import("./pages/services/OrderConfirmationPage"));
const OrderTrackingPage = lazyRetry(() => import("./pages/services/OrderTrackingPage"));

const queryClient = new QueryClient();

const PageLoader = () => <KukaPayLoader isLoading />;

const ProtectedWithKyc = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <KycGate>{children}</KycGate>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineGate>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Aliases for common home paths */}
                <Route path="/index" element={<Navigate to="/" replace />} />
                <Route path="/index.html" element={<Navigate to="/" replace />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                {/* Public auth routes */}
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/confirm-email" element={<ConfirmEmailPage />} />
                
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy-consent" element={<PrivacyConsentPage />} />
                <Route path="/privacy" element={<PrivacyConsentPage />} />
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/refunds" element={<RefundPolicyPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/confirm" element={<AuthConfirmPage />} />
                <Route path="/install" element={<InstallPage />} />

                {/* Protected - KYC page (no KYC gate) */}
                <Route path="/kyc" element={<ProtectedRoute><KycPage /></ProtectedRoute>} />
                <Route path="/kyc/guide" element={<KycGuidePage />} />
                <Route path="/security/set-login-pin" element={<ProtectedRoute><SetLoginPinPage /></ProtectedRoute>} />
                <Route path="/security/activity" element={<ProtectedRoute><AppShell><SessionsPage /></AppShell></ProtectedRoute>} />


                {/* Protected + KYC gated */}
                <Route path="/" element={<ProtectedWithKyc><AppShell><Index /></AppShell></ProtectedWithKyc>} />
                <Route path="/add-money" element={<ProtectedWithKyc><AppShell><AddMoneyPage /></AppShell></ProtectedWithKyc>} />
<Route path="/send" element={<ProtectedWithKyc><AppShell><SendPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/transfer/success" element={<ProtectedWithKyc><TransferSuccessPage /></ProtectedWithKyc>} />
                <Route path="/collect" element={<ProtectedWithKyc><AppShell><CollectPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/collect/new" element={<ProtectedWithKyc><AppShell><CreateCollectionPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/pay/:id" element={<AppShell><PayCollectionPage /></AppShell>} />
                <Route path="/withdraw" element={<ProtectedWithKyc><AppShell><WithdrawalPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/wallet/convert-crypto" element={<ProtectedWithKyc><AppShell><CryptoConvertPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/transactions" element={<ProtectedWithKyc><AppShell><TransactionsPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/ajo/invite/:id" element={<AppShell><AjoInvitePage /></AppShell>} />
                <Route path="/discover" element={<ProtectedWithKyc><AppShell><ServicesPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/wallet" element={<ProtectedWithKyc><AppShell><WalletPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/errands" element={<ProtectedWithKyc><AppShell><ErrandsPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/errands/new" element={<ProtectedWithKyc><AppShell><PostErrandPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/airtime" element={<ProtectedWithKyc><AppShell><AirtimePage /></AppShell></ProtectedWithKyc>} />
                <Route path="/savings" element={<ProtectedWithKyc><AppShell><SavingsPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/ajo" element={<ProtectedWithKyc><AppShell><AjoPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/ajo/new" element={<ProtectedWithKyc><AppShell><CreateAjoPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/ajo/:id" element={<ProtectedWithKyc><AppShell><AjoDetailPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/profile" element={<ProtectedWithKyc><AppShell><ProfilePage /></AppShell></ProtectedWithKyc>} />
                <Route path="/events" element={<ProtectedWithKyc><AppShell><EventsPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/events/new" element={<ProtectedWithKyc><AppShell><CreateEventPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/events/:id" element={<ProtectedWithKyc><AppShell><EventDetailPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/events/:id/dashboard" element={<ProtectedWithKyc><AppShell><EventDashboardPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/events/:id/scan" element={<ProtectedWithKyc><AppShell><ScanTicketPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/tickets/:qrCode" element={<ProtectedWithKyc><AppShell><TicketViewPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/merchants" element={<ProtectedWithKyc><AppShell><MerchantDirectoryPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/merchants/onboard" element={<ExternalMerchantRedirect />} />
                <Route path="/merchants/dashboard" element={<ExternalMerchantRedirect />} />
                <Route path="/merchants/products" element={<ExternalMerchantRedirect />} />
                <Route path="/merchants/orders" element={<ExternalMerchantRedirect />} />
                <Route path="/merchants/pay/:id" element={<ProtectedWithKyc><AppShell><MerchantPayPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/merchants/store/:id" element={<ProtectedWithKyc><AppShell><MerchantStorePage /></AppShell></ProtectedWithKyc>} />
                <Route path="/runner/register" element={<ProtectedWithKyc><AppShell><RunnerRegistrationPage /></AppShell></ProtectedWithKyc>} />
                <Route path="/rides" element={<ProtectedWithKyc><AppShell><RideBookingPage /></AppShell></ProtectedWithKyc>} />

              <Route path="/services/request/new" element={<ProtectedWithKyc><AppShell><RequestServicePage /></AppShell></ProtectedWithKyc>} />
              <Route path="/services/requests" element={<ProtectedWithKyc><AppShell><ServiceRequestsPage /></AppShell></ProtectedWithKyc>} />
              <Route path="/services/requests/:id" element={<ProtectedWithKyc><AppShell><ServiceRequestDetailPage /></AppShell></ProtectedWithKyc>} />
              <Route path="/services/printing" element={<ProtectedWithKyc><AppShell><PrintingDirectoryPage /></AppShell></ProtectedWithKyc>} />
              <Route path="/services/printing/:merchantId" element={<ProtectedWithKyc><AppShell><PrintingCheckoutPage /></AppShell></ProtectedWithKyc>} />
              <Route path="/services/laundry" element={<ProtectedWithKyc><AppShell><LaundryDirectoryPage /></AppShell></ProtectedWithKyc>} />
              <Route path="/services/laundry/:merchantId" element={<ProtectedWithKyc><AppShell><LaundryCheckoutPage /></AppShell></ProtectedWithKyc>} />
              <Route path="/services/food" element={<ProtectedWithKyc><AppShell><FoodDirectoryPage /></AppShell></ProtectedWithKyc>} />
              <Route path="/services/food/:id" element={<ProtectedWithKyc><AppShell><MerchantStorePage /></AppShell></ProtectedWithKyc>} />
              <Route path="/orders/:orderId/confirmation" element={<ProtectedWithKyc><AppShell><OrderConfirmationPage /></AppShell></ProtectedWithKyc>} />
              <Route path="/orders/:orderId" element={<ProtectedWithKyc><AppShell><OrderTrackingPage /></AppShell></ProtectedWithKyc>} />


              {/* Dollar Vault temporarily disabled */}
              <Route path="/vault/*" element={<Navigate to="/" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </OfflineGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
