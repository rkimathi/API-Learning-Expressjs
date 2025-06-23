import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './components/layouts/AppLayout';
// App.jsx is not used in this router setup directly, but could be a page if needed.
// import App from './App';
import './index.css';

// Import Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TasksPage from './pages/TasksPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';


const router = createBrowserRouter([
  {
    element: <AppLayout />, // AppLayout wraps pages with common structure
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/tasks',
        element: <TasksPage />, // This will be a protected route later
      },
      {
        path: '/profile',
        element: <ProfilePage />, // This will be a protected route later
      },
    ],
  },
  {
    path: '*', // Catch-all for 404, outside of AppLayout
    element: <NotFoundPage />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
