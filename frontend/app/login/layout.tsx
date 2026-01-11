import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - ZoneNet",
    description: "Login to ZoneNet",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            {children}
        </div>
    );
}
