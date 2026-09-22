import { TabBar } from "@/components/nav/TabBar";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-[640px] px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-safe">
        {children}
      </main>
      <TabBar />
    </>
  );
}
