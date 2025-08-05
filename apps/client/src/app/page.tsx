import {auth} from "@/auth";
import InputForm from "@/components/InputForm";
import {getProfileByUserId} from "@/db/users";

async function HomePage() {
    const session = await auth();
    if (!session || !session.user) return null;
    const user_id = session.user.id;
    const email = session.user.email;
    if (!user_id || !email) return null;
    const user = await getProfileByUserId(user_id);
    console.log("changed!!");
    console.log("walletAddress: ", user?.walletAddress);
    return (
        <div className="bg-gray-50 h-dvh">
            <div className="mx-auto  max-w-2xl px-4 pt-20 pb-24 sm:px-6 lg:max-w-7xl lg:px-8">
                <h2 className="sr-only">Profile</h2>
                <InputForm email={email} github_id={user_id} walletAddress={user?.walletAddress} />
            </div>
        </div>
    );
}

export default HomePage;
