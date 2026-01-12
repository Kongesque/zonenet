import { AuthGuard } from "@/components/auth-guard";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-background flex items-center justify-center">
                {children}
            </div>
        </AuthGuard>
    );
}
