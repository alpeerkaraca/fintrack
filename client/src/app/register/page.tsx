import RegisterClient from "@/components/auth/RegisterClient";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white dark:bg-zinc-950">
      {/* Brutalist Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="relative z-10">
        <RegisterClient />
      </div>
    </main>
  );
}
