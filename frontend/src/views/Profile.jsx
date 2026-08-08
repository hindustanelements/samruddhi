"use client";

import { useEffect, useState } from "react";
import { Pencil, Save } from "lucide-react";
import { useApp } from "../context/AppContext";
import { request } from "../lib/store";
import AuthPage from "./AuthPage";

function Profile() {
  const { user, updateUser } = useApp();
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({ name: user?.name || "", mobile: user?.mobile || "", address: user?.address || "", city: user?.city || "", pincode: user?.pincode || "" });
  const [editing, setEditing] = useState(!user?.mobile || !user?.address || !user?.city || !user?.pincode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hasFullProfile = Boolean(profile?.name && profile?.mobile && profile?.address && profile?.city && profile?.pincode);

  useEffect(() => {
    if (!user) return;
    request("/profile").then((data) => {
      setProfile(data);
      updateUser(data);
      setForm({ name: data.name || "", mobile: data.mobile || "", address: data.address || "", city: data.city || "", pincode: data.pincode || "" });
      setEditing(!data.mobile || !data.address || !data.city || !data.pincode);
    }).catch((e) => setError(e.message));
  }, [user?.id]);

  if (!user) return <AuthPage/>;

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request("/profile", { method: "PUT", body: JSON.stringify(form) });
      setProfile(data);
      updateUser(data);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return <main className="container-site py-12">
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">My account</p><h1 className="mt-2 text-4xl text-forest">Profile</h1><p className="mt-2 text-sm text-ink/50">{hasFullProfile && !editing ? "Your saved details and delivery address." : "Add your details once, then they will be shown here."}</p></div>{hasFullProfile && !editing && <button onClick={()=>setEditing(true)} className="btn-light"><Pencil size={17}/> Edit profile</button>}</div>
      {error&&<p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {editing ? <form onSubmit={saveProfile} className="card mt-8 grid gap-4 p-6 sm:grid-cols-2">
        <input required className="field" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <input required className="field" placeholder="Mobile number" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})}/>
        <input disabled className="field bg-cream text-ink/50" value={user.email}/>
        <input required className="field" placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/>
        <input required className="field" placeholder="Pincode" value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value})}/>
        <textarea required className="field min-h-28 sm:col-span-2" placeholder="Complete address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row"><button disabled={busy} className="btn-primary"><Save size={17}/>{busy ? "Saving..." : "Save profile"}</button>{hasFullProfile&&<button type="button" onClick={()=>{setEditing(false);setForm({ name: profile.name || "", mobile: profile.mobile || "", address: profile.address || "", city: profile.city || "", pincode: profile.pincode || "" })}} className="btn-light">Cancel</button>}</div>
      </form> : <section className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="card p-6"><h2 className="text-2xl text-forest">User data</h2><div className="mt-5 space-y-4 text-sm"><p><span className="block text-xs font-bold uppercase tracking-wider text-clay">Name</span>{profile.name}</p><p><span className="block text-xs font-bold uppercase tracking-wider text-clay">Email</span>{profile.email}</p><p><span className="block text-xs font-bold uppercase tracking-wider text-clay">Mobile</span>{profile.mobile}</p></div></div>
        <div className="card p-6"><h2 className="text-2xl text-forest">Address</h2><div className="mt-5 space-y-4 text-sm"><p className="leading-6">{profile.address}</p><p><span className="block text-xs font-bold uppercase tracking-wider text-clay">City</span>{profile.city}</p><p><span className="block text-xs font-bold uppercase tracking-wider text-clay">Pincode</span>{profile.pincode}</p></div></div>
      </section>}
    </div>
  </main>;
}

export default Profile;
