"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, Check } from "lucide-react";

export default function SetupPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { setup } = useAuth();
    const router = useRouter();

    const passwordRequirements = [
        { label: "At least 8 characters", met: password.length >= 8 },
    ];

    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        const result = await setup(password, confirmPassword);

        if (result.success) {
            router.push("/");
        } else {
            setError(result.error || "Setup failed");
        }

        setIsLoading(false);
    };

    return (
        <Card className="w-full max-w-sm mx-4">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-2">
                    <div className="p-3 rounded-full bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Welcome to Locus</CardTitle>
                <CardDescription>Set up your password to get started</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        {passwordRequirements.map((req, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                {req.met ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                    <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                                )}
                                <span className={req.met ? "text-green-500" : "text-muted-foreground"}>
                                    {req.label}
                                </span>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 text-xs">
                            {passwordsMatch ? (
                                <Check className="h-3 w-3 text-green-500" />
                            ) : (
                                <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                            )}
                            <span className={passwordsMatch ? "text-green-500" : "text-muted-foreground"}>
                                Passwords match
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !passwordRequirements.every(r => r.met) || !passwordsMatch}
                    >
                        {isLoading ? "Setting up..." : "Complete Setup"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
