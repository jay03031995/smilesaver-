import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingActions from "./components/FloatingActions";
import SmoothScroll from "./components/SmoothScroll";
import Loader from "./components/Loader";
import ToothCursor from "./components/ToothCursor";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Doctors from "./pages/Doctors";
import Gallery from "./pages/Gallery";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Contact from "./pages/Contact";
import Booking from "./pages/Booking";
import SmileAnalysis from "./pages/SmileAnalysis";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import BlogEditor from "./pages/admin/BlogEditor";

function ScrollTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ChromeWrapper({ children }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <>
      {!isAdmin && <Header/>}
      <main>{children}</main>
      {!isAdmin && <Footer/>}
      {!isAdmin && <FloatingActions/>}
    </>
  );
}

function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="App">
      {!loaded && <Loader onDone={() => setLoaded(true)}/>}
      <BrowserRouter>
        <SmoothScroll/>
        <ScrollTop/>
        {window.innerWidth > 768 && <ToothCursor />}
        <ChromeWrapper>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/about" element={<About/>}/>
            <Route path="/services" element={<Services/>}/>
            <Route path="/services/:slug" element={<ServiceDetail/>}/>
            <Route path="/doctors" element={<Doctors/>}/>
            <Route path="/gallery" element={<Gallery/>}/>
            <Route path="/blog" element={<Blog/>}/>
            <Route path="/blog/:slug" element={<BlogDetail/>}/>
            <Route path="/contact" element={<Contact/>}/>
            <Route path="/booking" element={<Booking/>}/>
            <Route path="/smile-analysis" element={<SmileAnalysis/>}/>
            <Route path="/admin/login" element={<AdminLogin/>}/>
            <Route path="/admin" element={<AdminDashboard/>}/>
            <Route path="/admin/blog/new" element={<BlogEditor/>}/>
            <Route path="/admin/blog/:slug/edit" element={<BlogEditor/>}/>
          </Routes>
        </ChromeWrapper>
        <Toaster position="top-center" richColors/>
      </BrowserRouter>
    </div>
  );
}

export default App;
