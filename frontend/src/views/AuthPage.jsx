"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { useApp } from "../context/AppContext";
import { request } from "../lib/store";

function AuthPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [staffMode, setStaffMode] = useState(false);
  const [staffStep, setStaffStep] = useState("email");
  const [customerStep, setCustomerStep] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", otp: "", newPassword: "" });
  const [staff, setStaff] = useState({ email: "", otp: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submitCustomer = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email: form.email, password: form.password }) });
      login(data);
      navigate(data.user.role === "ADMIN" ? "/admin" : "/products");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const requestCustomerReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await request("/auth/customer/request-password-reset", { method: "POST", body: JSON.stringify({ email: form.email }) });
      setCustomerStep("verify");
      setMessage(data.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyCustomerOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await request("/auth/customer/verify-password-otp", { method: "POST", body: JSON.stringify({ email: form.email, otp: form.otp }) });
      setCustomerStep("newPassword");
      setMessage(data.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resetCustomerPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await request("/auth/customer/reset-password", { method: "POST", body: JSON.stringify({ email: form.email, password: form.newPassword }) });
      login(data);
      navigate("/products");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const requestStaffOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await request("/auth/staff/request-otp", { method: "POST", body: JSON.stringify({ email: staff.email }) });
      setStaffStep("otp");
      setMessage(data.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyStaffOtp = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await request("/auth/staff/verify-otp", { method: "POST", body: JSON.stringify(staff) });
      login(data);
      navigate("/admin");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const showCustomerLogin = () => {
    setStaffMode(false);
    setCustomerStep("login");
    setError("");
    setMessage("");
  };

  const showStaffLogin = () => {
    setStaffMode(true);
    setStaffStep("email");
    setError("");
    setMessage("");
  };

  const customerTitle = customerStep === "login" ? "Customer login" : customerStep === "forgot" ? "Forgot password" : customerStep === "verify" ? "Verify OTP" : "New password";

  return <main className="container-site py-16"><div className="mx-auto grid max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-soft md:grid-cols-2"><div className="relative hidden min-h-[570px] md:block"><img src="/samruddhi-hero.png" className="absolute inset-0 h-full w-full object-cover" alt="Samruddhi"/><div className="absolute inset-0 bg-forest/65"/><div className="relative flex h-full flex-col justify-end p-9 text-white"><Leaf size={30}/><h2 className="mt-4 text-4xl">A more natural pantry starts here.</h2><p className="mt-3 text-sm text-white/70">Save favourites, track orders and make wholesome shopping simpler.</p></div></div><div className="p-8 md:p-10"><div className="grid grid-cols-2 gap-2 rounded-full bg-cream p-1"><button type="button" onClick={showCustomerLogin} className={`rounded-full px-4 py-2 text-sm font-bold transition ${!staffMode ? "bg-white text-forest shadow-sm" : "text-ink/50"}`}>Customer</button><button type="button" onClick={showStaffLogin} className={`rounded-full px-4 py-2 text-sm font-bold transition ${staffMode ? "bg-white text-forest shadow-sm" : "text-ink/50"}`}>Staff login</button></div>{!staffMode ? <form onSubmit={customerStep==="login"?submitCustomer:customerStep==="forgot"?requestCustomerReset:customerStep==="verify"?verifyCustomerOtp:resetCustomerPassword} className="mt-7"><p className="eyebrow">Customer account</p><h1 className="mt-2 text-3xl text-forest">{customerTitle}</h1><p className="mt-3 text-sm leading-6 text-ink/55">{customerStep==="login"?"Login with your email and password.":customerStep==="forgot"?"Enter your customer email to reset your password.":customerStep==="verify"?"Enter the OTP sent to your customer email.":"OTP verified. Set your new password."}</p><div className="mt-7 space-y-4"><input required disabled={customerStep==="newPassword"} type="email" className="field disabled:bg-cream disabled:text-ink/50" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>{customerStep==="login"&&<input required minLength={6} type="password" className="field" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>} {customerStep==="verify"&&<input required inputMode="numeric" minLength={6} maxLength={6} className="field" placeholder="6 digit OTP" value={form.otp} onChange={e=>setForm({...form,otp:e.target.value.replace(/\D/g,"").slice(0,6)})}/>} {customerStep==="newPassword"&&<input required minLength={6} type="password" className="field" placeholder="New password" value={form.newPassword} onChange={e=>setForm({...form,newPassword:e.target.value})}/>}</div>{message&&<p className="mt-4 text-sm text-forest">{message}</p>}{error&&<p className="mt-4 text-sm text-red-600">{error}</p>}<button disabled={busy} className="btn-primary mt-6 w-full">{busy?"Please wait...":customerStep==="login"?"Login":customerStep==="forgot"?"Send OTP":customerStep==="verify"?"Verify OTP":"Save new password"}</button><div className="mt-4 flex justify-center">{customerStep==="login"?<button type="button" onClick={()=>{setCustomerStep("forgot");setError("");setMessage("")}} className="text-sm font-bold text-forest hover:text-leaf">Forgot password?</button>:<button type="button" onClick={()=>{setCustomerStep("login");setError("");setMessage("")}} className="text-sm font-bold text-forest hover:text-leaf">Back to login</button>}</div></form> : <form onSubmit={staffStep==="email"?requestStaffOtp:verifyStaffOtp} className="mt-7"><p className="eyebrow">Staff login</p><h1 className="mt-2 text-3xl text-forest">{staffStep==="email"?"Enter staff email":"Verify OTP"}</h1><p className="mt-3 text-sm leading-6 text-ink/55">{staffStep==="email"?"Staff members can sign in with an OTP sent to their registered email.":"Enter the OTP sent to your staff email to open the admin dashboard."}</p><div className="mt-7 space-y-4"><input required disabled={staffStep==="otp"} type="email" className="field disabled:bg-cream disabled:text-ink/50" placeholder="Staff email address" value={staff.email} onChange={e=>setStaff({...staff,email:e.target.value})}/>{staffStep==="otp"&&<input required inputMode="numeric" minLength={6} maxLength={6} className="field" placeholder="6 digit OTP" value={staff.otp} onChange={e=>setStaff({...staff,otp:e.target.value.replace(/\D/g,"").slice(0,6)})}/>}</div>{message&&<p className="mt-4 text-sm text-forest">{message}</p>}{error&&<p className="mt-4 text-sm text-red-600">{error}</p>}<div className="mt-6 flex flex-col gap-3 sm:flex-row"><button disabled={busy} className="btn-primary flex-1">{busy?"Please wait...":staffStep==="email"?"Send OTP":"Verify and login"}</button>{staffStep==="otp"&&<button type="button" onClick={()=>{setStaffStep("email");setStaff({...staff,otp:""});setMessage("");setError("");}} className="btn-light flex-1">Change email</button>}</div></form>}</div></div></main>;
}

export default AuthPage;
