import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import styles from "./App.module.scss";
import HomePage from "./components/HomePage";
import AdminPage from "./components/AdminPage/index.jsx";
import Header from "./components/Header/index.jsx";
import ProtectedRoute from "./components/ProtectRoute/index.jsx";
import UserPage from "./components/UserPage/index.jsx";
import PublicGamesPage from "./components/PublicGamesPage/index.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layout component que inclui o Header
function Layout() {
  return (
    <div className={styles.App}>
      <Header />
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
          path: "/games",
          element: <PublicGamesPage />
        },
        {
          path: "/admin",
          element: <ProtectedRoute><AdminPage /></ProtectedRoute>
        },
        {
          path: "/user",
          element: <ProtectedRoute><UserPage /></ProtectedRoute>
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
