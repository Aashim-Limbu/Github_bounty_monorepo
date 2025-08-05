import React from "react";
import {auth} from "@/auth";
async function DashBoard() {
    const session = await auth();
    return (
        <div className="mt-30 text-white w-full max-w-7xl mx-auto">
            <div>DashBoard</div>
            <div>{JSON.stringify(session)}</div>
        </div>
    );
}

export default DashBoard;
