import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RequireStaff } from '@/features/admin/RequireStaff';

import { HomePage } from '@/pages/storefront/HomePage';
import { SectionPage } from '@/pages/storefront/SectionPage';
import { ProductDetailPage } from '@/pages/storefront/ProductDetailPage';
import { StitchingPage } from '@/pages/storefront/StitchingPage';
import { CartPage } from '@/pages/storefront/CartPage';
import { CheckoutPage } from '@/pages/storefront/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/storefront/OrderConfirmationPage';
import { OutletPage } from '@/pages/storefront/OutletPage';
import { NotFoundPage } from '@/pages/storefront/NotFoundPage';
import { SignInPage } from '@/pages/storefront/SignInPage';
import { SignUpPage } from '@/pages/storefront/SignUpPage';
import { ForgotPasswordPage } from '@/pages/storefront/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/storefront/ResetPasswordPage';
import { AccountPage } from '@/pages/storefront/AccountPage';

import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminSectionsPage } from '@/pages/admin/AdminSectionsPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminProductFormPage } from '@/pages/admin/AdminProductFormPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* storefront */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/s/:sectionSlug" element={<SectionPage />} />
          <Route path="/s/:sectionSlug/:categorySlug" element={<SectionPage />} />
          <Route path="/p/:slug" element={<ProductDetailPage />} />
          <Route path="/stitch/:slug" element={<StitchingPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/outlet" element={<OutletPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>

        {/* admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireStaff>
              <AdminLayout />
            </RequireStaff>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="sections" element={<AdminSectionsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id" element={<AdminProductFormPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
