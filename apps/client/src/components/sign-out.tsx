"use client";

import {signOut} from "next-auth/react";
import Button from "./Button";

export default function SignOut() {
    return (
        <Button variant="secondary" onClick={() => signOut()}>
            SignOut
        </Button>
    );
}
