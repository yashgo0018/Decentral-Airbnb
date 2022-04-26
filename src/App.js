import React from 'react';
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Rentals from './pages/Rentals.jsx';
import './App.css';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rentals" element={<Rentals />} />
    </Routes>
  )
};

export default App;
