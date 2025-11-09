import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "./components/dashboard";
import MedicationManager from "./components/medicationManager";
import SymptomTracker from "./components/symptom";
import GoalSetter from "./components/goalssetters";
import ReminderSystem from "./components/reminderSystem";
import Login from "./components/login";
import Register from "./components/register";
import Profile from "./components/profile";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and user data
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            Loading Health Management System...
          </p>
        </motion.div>
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4,
  };

  return (
    <>
      {" "}
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
            
                * {
                    font-family: 'Poppins', sans-serif;
                }
            `}</style>{" "}
      <Router>
        <div className="App">
          <AnimatePresence mode="wait">
            <Routes>
              <Route
                path="/login"
                element={
                  !token ? (
                    <motion.div
                      key="login"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Login onLogin={login} />
                    </motion.div>
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  !token ? (
                    <motion.div
                      key="register"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Register onLogin={login} />
                    </motion.div>
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={
                  token ? (
                    <motion.div
                      key="dashboard"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Dashboard user={user} onLogout={logout} />
                    </motion.div>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/medications"
                element={
                  token ? (
                    <motion.div
                      key="medications"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <MedicationManager user={user} />
                    </motion.div>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/symptoms"
                element={
                  token ? (
                    <motion.div
                      key="symptoms"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <SymptomTracker user={user} />
                    </motion.div>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/goals"
                element={
                  token ? (
                    <motion.div
                      key="goals"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <GoalSetter user={user} />
                    </motion.div>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/reminders"
                element={
                  token ? (
                    <motion.div
                      key="reminders"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <ReminderSystem user={user} />
                    </motion.div>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/profile"
                element={
                  token ? (
                    <motion.div
                      key="profile"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Profile user={user} onUpdate={updateUser} />
                    </motion.div>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/"
                element={
                  <Navigate to={token ? "/dashboard" : "/login"} replace />
                }
              />
              {/* 404 Page */}
              <Route
                path="*"
                element={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-gray-900 mb-4">
                        404
                      </h1>
                      <p className="text-xl text-gray-600 mb-8">
                        Page not found
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.history.back()}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Go Back
                      </motion.button>
                    </div>
                  </motion.div>
                }
              />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
      <footer className="flex flex-col items-center justify-center w-full py-20 bg-gradient-to-b from-[#86acd6] to-[#a777d1] text-white/70">
        <p className="mt-4 text-center">
          Copyright © 2025 JessicaTechHub. All rights reservered.
        </p>
        <div className="flex items-center gap-4 mt-5">
          <a
            href="#"
            className="hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a
            href="#"
            className="hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5"
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 11.37a4 4 0 1 1-7.914 1.173A4 4 0 0 1 16 11.37m1.5-4.87h.01"
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a
            href="#"
            className="hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6M6 9H2v12h4zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a
            href="#"
            className="hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2"
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a
            href="#"
            className="hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 18c-4.51 2-5-2-7-2"
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </footer>
    </>
  );
}

export default App;

// import React from "react";

// const App = () => {
//   return (
//     <div>
//       <h1 class="text-3xl font-bold underline">Hello world!</h1>
//     </div>
//   );
// };

// export default App;
