"use client";

import {signIn} from "next-auth/react";
import {FaGithub} from "react-icons/fa";

export default function SignIn() {
    return (
        <button
            className="bg-blue-500 text-lg p-2 text-white rounded-md inline-flex cursor-pointer items-center"
            onClick={() => signIn("github")}
        >
            <span className="mr-2">Sign in</span>
            <FaGithub />
        </button>
    );
}
