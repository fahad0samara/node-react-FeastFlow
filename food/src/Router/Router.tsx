import {Routes, Route, Navigate, useLocation} from "react-router-dom";
import {useSelector} from "react-redux";
import {lazy, Suspense} from "react";
import NotFound from "../Home/NotFound";
import Header from "../Home/Header";
import Sidebar from "../Admin/Sidebar";
import UserManagement from "../Admin/UserManagement";
import AddMenuItem from "../Admin/Menu/AddMenuItem";
import ListMenu from "../Admin/Menu/ListMenu";
import OrderList from "../Admin/OrderList";
import Loder from "../Loder";
import { GoogleCallback } from '../Auth/GoogleCallback';

const Hero = lazy(() => import("../Home/Hero"));
const Menu = lazy(() => import("../User/Menu"));
const Register = lazy(() => import("../Auth/Register"));
const Login = lazy(() => import("../Auth/Login"));
const Cart = lazy(() => import("../User/Cart/Cart"));
const Success = lazy(() => import("../User/Cart/Success"));
const Checkout = lazy(() => import("../User/Cart/Checkout"));

interface RootState {
  auth: {
    error: any;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
  };
}

const Router = (): JSX.Element => {
  const { isAuthenticated, isAdmin} = useSelector(
    (state: RootState) => state.auth
  );

  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname.toLowerCase());

  return (
    <div className="flex">
      {!isAuthPage && !isAdmin && <Header />}
      {isAdmin && <Sidebar />}
      
      <div className={`${isAdmin ? "md:pl-16 flex-grow" : "w-full"}`}>
        <Suspense fallback={<Loder />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Hero />} />
            <Route path="/menu" element={<Menu />} />
            
            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={
                !isAuthenticated ? (
                  <Login />
                ) : (
                  <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                !isAuthenticated ? (
                  <Register />
                ) : (
                  <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace />
                )
              } 
            />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />

            {/* Protected User Routes */}
            {isAuthenticated && !isAdmin && (
              <>
                <Route path="/checkout" element={<Checkout totalPrice={0} />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/success" element={<Success />} />
                <Route path="/menu/:categoryId" element={<Menu />} />
              </>
            )}

            {/* Protected Admin Routes */}
            {isAuthenticated && isAdmin && (
              <>
                <Route path="/admin/dashboard" element={<UserManagement />} />
                <Route path="/admin/menu/add" element={<AddMenuItem />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/menu" element={<ListMenu />} />
                <Route path="/admin/orders" element={<OrderList />} />
              </>
            )}

            {/* Catch-all Route */}
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <NotFound />
                ) : (
                  <Navigate to="/login" replace state={{ from: location }} />
                )
              }
            />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default Router;
