import { createClient } from "@/lib/supabase/client";

const supabase = createClient(); // Browser client
supabase.auth.getUser().then(({ data: { user } }) => {
    if (user?.role !== "admin") {
        console.log("User is not an admin, redirecting...");
        window.location.href = "/auth/signin"; // Redirect to sign-in page
    }
});