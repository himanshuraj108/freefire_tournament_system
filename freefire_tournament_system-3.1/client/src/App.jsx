import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import AdminDashboard from './pages/Admin/Dashboard';
import { AuthProvider } from './context/AuthContext';

import Tournaments from './pages/Tournaments';
import AllTournaments from './pages/AllTournaments'; // Import Archive Page

import PrivateRoute from './components/routing/PrivateRoute';

// Placeholder Pages
import Videos from './pages/Videos';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import TournamentRoom from './pages/TournamentRoom';
import Settings from './pages/Settings';

import { Toaster } from 'react-hot-toast';

import { SearchProvider } from './context/SearchContext';

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <Toaster position="top-center" toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/" element={
            <Layout>
              <Home />
            </Layout>
          } />

          <Route path="/tournaments" element={
            <Layout>
              <Tournaments />
            </Layout>
          } />

          <Route path="/all-tournaments" element={
            <Layout>
              <AllTournaments />
            </Layout>
          } />

          <Route path="/tournament/:id" element={
            <Layout>
              <TournamentRoom />
            </Layout>
          } />

          <Route path="/videos" element={
            <Layout>
              <Videos />
            </Layout>
          } />

          <Route path="/admin" element={
            <Layout>
              <AdminDashboard />
            </Layout>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/edit-profile" element={
            <PrivateRoute>
              <Layout>
                <EditProfile />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/settings" element={
            <PrivateRoute>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
