import LoginSwitcher from "@/components/LoginSwitcher";

// This page is a client-side component wrapper, so we don't need 'force-dynamic'.
// Let Next.js handle it as a static shell.
export default function LoginPage() {
    return (
        <LoginSwitcher />
    );
}
