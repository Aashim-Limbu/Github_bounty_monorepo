"use client";
import {useSession} from "next-auth/react";
import SignIn from "./sign-in";
import SignOut from "./sign-out";

export default function Navbar() {
    const {data: session} = useSession();
    return (
        <nav className="fixed top-0 left-0 bg-black">
            <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
                <p className="bg-linear-to-r from-blue-600 to-blue-400 bg-clip-text text-2xl font-extrabold text-transparent">
                    Github Bounty Dispenser
                </p>
                <div className="inline-flex items-center justify-center">
                    {session?.user ? <SignOut /> : <SignIn />}
                </div>
            </div>
        </nav>
    );
}
