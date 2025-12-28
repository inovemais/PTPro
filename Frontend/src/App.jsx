import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from "react-router-dom";
import styles from "./App.module.scss";
import HomePage from "./components/HomePage";
import AdminPage from "./components/AdminPage/index.jsx";
import Header from "./components/Header/index.jsx";
import ProtectedRoute from "./components/ProtectRoute/index.jsx";
import UserPage from "./components/UserPage/index.jsx";
import RegisterPage from "./components/RegisterPage";
import TrainerDashboard from "./components/TrainerDashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layout component que inclui o Header
function Layout() {
  const location = useLocation();
  const hideHeader = location.pathname === "/admin";
  
  return (
    <div className={styles.App}>
      {!hideHeader && <Header />}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <HomePage />
        },
        {
          path: "/register",
          element: <RegisterPage />
        },
        {
          path: "/admin",
          element: <ProtectedRoute><AdminPage /></ProtectedRoute>
        },
        {
          path: "/user",
          element: <ProtectedRoute><UserPage /></ProtectedRoute>
        },
        {
          path: "/trainer",
          element: <ProtectedRoute><TrainerDashboard /></ProtectedRoute>
        },
      ]
    },
  ]);

  return (
    <div className={styles.App}>
      <ToastContainer />
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
