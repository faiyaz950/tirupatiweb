import { Suspense } from "react";
import dynamic from "next/dynamic";

// Loading component for better UX
function LoginLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 w-48 mx-auto mb-4 rounded"></div>
            <div className="bg-gray-200 h-4 w-32 mx-auto mb-8 rounded"></div>
            <div className="space-y-4">
              <div className="bg-gray-200 h-12 w-full rounded"></div>
              <div className="bg-gray-200 h-12 w-full rounded"></div>
              <div className="bg-gray-200 h-12 w-full rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamically import LoginForm to prevent SSR issues
const LoginForm = dynamic(() => import("@/components/auth/LoginForm").then(mod => ({ default: mod.LoginForm })), {
  loading: () => <LoginLoading />,
  ssr: false
});

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
