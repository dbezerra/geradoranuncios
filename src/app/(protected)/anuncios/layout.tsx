import { SuspenseWrap } from "@/components/SuspenseWrap";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SuspenseWrap>{children}</SuspenseWrap>;
}
