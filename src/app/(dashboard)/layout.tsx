import { BottomNav } from "@/components/bottom-nav";
import PageTransition from "@/components/page-transition";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex justify-center items-center min-h-screen w-full">
            <div className="w-full max-w-md h-[100dvh] bg-background shadow-2xl relative flex flex-col overflow-hidden sm:h-[95vh] sm:rounded-[40px] sm:border-8 sm:border-zinc-800">
                {/* Status Bar simulation for desktop feel */}
                <div className="h-6 w-full bg-background absolute top-0 z-50 hidden sm:block"></div>

                <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 no-scrollbar">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
                <BottomNav />
            </div>
        </div>
    );
}
