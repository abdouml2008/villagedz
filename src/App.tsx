// Village Store App
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/store/Home"));
const Category = lazy(() => import("./pages/store/Category"));
const ProductDetail = lazy(() => import("./pages/store/ProductDetail"));
const Cart = lazy(() => import("./pages/store/Cart"));
const Checkout = lazy(() => import("./pages/store/Checkout"));
const TrackOrder = lazy(() => import("./pages/store/TrackOrder"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminDeliveryPrices = lazy(() => import("./pages/admin/DeliveryPrices"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const OrdersByStatus = lazy(() => import("./pages/admin/OrdersByStatus"));
const AdminSocialLinks = lazy(() => import("./pages/admin/SocialLinks"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
  </div>
);

const App = () => {

  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/category/:slug" element={<Category />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/track-order" element={<TrackOrder />} />
                      <Route path="/admin" element={<AdminLogin />} />
                      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                      <Route path="/admin/products" element={<AdminRoute section="products"><AdminProducts /></AdminRoute>} />
                      <Route path="/admin/orders" element={<AdminRoute section="orders"><AdminOrders /></AdminRoute>} />
                      <Route path="/admin/orders/:status" element={<AdminRoute section="orders"><OrdersByStatus /></AdminRoute>} />
                      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                      <Route path="/admin/delivery-prices" element={<AdminRoute section="delivery-prices"><AdminDeliveryPrices /></AdminRoute>} />
                      <Route path="/admin/analytics" element={<AdminRoute section="analytics"><AdminAnalytics /></AdminRoute>} />
                      <Route path="/admin/coupons" element={<AdminRoute section="coupons"><AdminCoupons /></AdminRoute>} />
                      <Route path="/admin/categories" element={<AdminRoute section="categories"><AdminCategories /></AdminRoute>} />
                      <Route path="/admin/banners" element={<AdminRoute section="banners"><AdminBanners /></AdminRoute>} />
                      <Route path="/admin/reviews" element={<AdminRoute section="reviews"><AdminReviews /></AdminRoute>} />
                      <Route path="/admin/social-links" element={<AdminRoute section="social-links"><AdminSocialLinks /></AdminRoute>} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
