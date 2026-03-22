 "use client";

 import { useEffect, useState } from "react";
 import { collection, getDocs } from "firebase/firestore";
 import { db } from "@/lib/firebase";
 import { useRouter } from "next/navigation";

 export default function ProfilesPage() {
   const [users, setUsers] = useState([]);
   const [search, setSearch] = useState("");
   const [loading, setLoading] = useState(true);

   const router = useRouter();

   useEffect(() => {
     const loadUsers = async () => {
       try {
         const snap = await getDocs(collection(db, "users"));

         const results = snap.docs.map((doc) => ({
           id: doc.id,
           ...doc.data(),
         }));

         setUsers(results);
       } catch (err) {
         console.error("Failed to load users:", err);
       } finally {
         setLoading(false);
       }
     };

     loadUsers();
   }, []);

   const filtered = users.filter((user) =>
     user.displayName?.toLowerCase().includes(search.toLowerCase())
   );

   if (loading) {
     return <div style={{ padding: 24 }}>Loading profiles...</div>;
   }

   return (
     <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
       <h1 style={{ marginBottom: 16 }}>Search Profiles</h1>

       <input
         placeholder="Search by name..."
         value={search}
         onChange={(e) => setSearch(e.target.value)}
         style={{
           width: "100%",
           padding: 10,
           marginBottom: 20,
           borderRadius: 8,
           border: "1px solid #ccc",
         }}
       />

       {filtered.map((user) => {
         const initials = user.displayName
           ?.split(" ")
           .map((n) => n[0])
           .join("")
           .toUpperCase();

         return (
           <div
             key={user.id}
             onClick={() => router.push(`/profile/${user.id}`)}
             style={{
               display: "flex",
               alignItems: "center",
               gap: 12,
               padding: 12,
               borderRadius: 10,
               marginBottom: 10,
               cursor: "pointer",
               border: "1px solid #eee",
               background: "var(--card)",
             }}
           >
             <div
               style={{
                 width: 50,
                 height: 50,
                 borderRadius: "50%",
                 overflow: "hidden",
                 background: "#ddd",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center",
                 fontWeight: "bold",
               }}
             >
               {user.profilePicture ? (
                 <img
                   src={user.profilePicture}
                   style={{ width: "100%", height: "100%", objectFit: "cover" }}
                 />
               ) : (
                 initials
               )}
             </div>

             <div>
               <div style={{ fontWeight: 600 }}>{user.displayName}</div>
               <div style={{ fontSize: 12, opacity: 0.7 }}>
                 {user.bio?.slice(0, 60)}
               </div>
             </div>
           </div>
         );
       })}
     </div>
   );
 }