import { FrontendNavbar } from "@/components/layout/frontend-navbar";
import { FrontendFooter } from "@/components/layout/frontend-footer";
import { ScrollProgress } from "@/components/shared/scroll-progress";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgress />
      <FrontendNavbar />
      <main className="pt-20">{children}</main>
      <FrontendFooter />
    </>
  );
}
