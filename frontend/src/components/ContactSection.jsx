"use client";

import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { request, STORE_PHONE } from "../lib/store";

export default function ContactSection({ standalone = false }) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/contact-submissions", { method: "POST", body: JSON.stringify(form) });
      setDone(true);
      setForm({ name: "", phone: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return <section className={`${standalone ? "container-site" : "bg-white"} py-16`}>
    <div className={`${standalone ? "" : "container-site"} grid gap-10 lg:grid-cols-2`}>
      <div>
        <p className="eyebrow">Contact us</p>
        <h2 className="section-title">Let's talk pantry.</h2>
        <p className="mt-4 max-w-md text-ink/60">Questions about products, clay-pot care, delivery, or bulk orders? Share your details and our team will contact you.</p>
        <div className="mt-8 space-y-4 text-sm">
          {[[Phone, `+91 ${STORE_PHONE}`], [Mail, "purchase@samruddhi.store"], [MapPin, "vizag,AndhraPradesh,India"]].map(([Icon, text]) => <p key={text} className="flex items-center gap-3"><Icon className="text-clay"/>{text}</p>)}
        </div>
      </div>
      <form className="card space-y-4 p-7" onSubmit={submit}>
        <input required className="field" placeholder="Your name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/>
        <input required inputMode="tel" className="field" placeholder="Phone number" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/>
        {error&&<p className="text-sm text-red-600">{error}</p>}
        {done&&<p className="text-sm font-semibold text-forest">Thank you. We will contact you soon.</p>}
        <button disabled={busy} className="btn-primary">{busy ? "Sending..." : "Send message"}</button>
      </form>
    </div>
  </section>;
}
