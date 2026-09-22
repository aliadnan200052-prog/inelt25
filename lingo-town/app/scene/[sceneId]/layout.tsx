export default function SceneLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-dvh w-full max-w-[640px] px-4">{children}</main>;
}
