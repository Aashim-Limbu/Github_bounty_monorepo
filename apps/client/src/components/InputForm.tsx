"use client";

import {useActionState, useEffect, useState} from "react";
import Button from "./Button";
import {createOrUpdateProfile} from "@/action/profile";
import {isAddress} from "viem";

type InputProps = {
    email: string;
    github_id: string;
    walletAddress: string | null | undefined;
};

const initialState = {
    success: false,
    message: "",
};

export default function InputForm({email, github_id, walletAddress}: InputProps) {
    const [state, action, pending] = useActionState(createOrUpdateProfile, initialState);
    const [isEditing, setIsEditing] = useState(!walletAddress); // Start editing if no wallet address
    const [currentWalletAddress, setCurrentWalletAddress] = useState("");
    const [originalWalletAddress, setOriginalWalletAddress] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    useEffect(() => {
        console.log("Initialize...");
    }, []);
    useEffect(() => {
        console.log("This is called wallet address effect");
        const address = walletAddress || "";
        setCurrentWalletAddress(address);
        setOriginalWalletAddress(address);
        setIsEditing(!walletAddress); // Only start editing if no existing address
    }, [walletAddress]);

    // Handle successful form submission
    useEffect(() => {
        console.log("state.success effect is called: ");
        if (state.success) {
            setIsEditing(false);
            setValidationError(null);
        }
    }, [state.success]);

    function handleWalletAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setCurrentWalletAddress(value);

        // Clear validation error when user starts typing
        if (validationError) {
            setValidationError(null);
        }

        // Validate wallet address if it's not empty
        if (value.trim() && !isAddress(value.trim())) {
            setValidationError("Please enter a valid Ethereum wallet address");
        }
    }

    function handleEditClick() {
        setIsEditing(true);
        setValidationError(null);
    }

    function handleCancelEdit() {
        setIsEditing(false);
        setCurrentWalletAddress(originalWalletAddress);
        setValidationError(null);
    }

    // Check if form can be submitted
    const canSubmit =
        currentWalletAddress.trim() &&
        (!currentWalletAddress.trim() || isAddress(currentWalletAddress.trim())) &&
        !pending;

    return (
        <div className="bg-gray-50">
            <div className="mx-auto max-w-2xl px-4 pt-16 pb-24 sm:px-6 lg:max-w-7xl lg:px-8">
                <h2 className="sr-only">Profile Information</h2>

                <form action={action} className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Profile information</h2>

                        {/* GitHub ID Field */}
                        <div className="mt-4">
                            <label htmlFor="github-id" className="block text-sm/6 font-medium text-gray-700">
                                Github ID
                            </label>
                            <div className="mt-2">
                                <input
                                    id="github-id"
                                    name="github-id"
                                    type="text"
                                    value={github_id}
                                    disabled={!!github_id}
                                    readOnly
                                    className={`
                                    block w-full rounded-md px-3 py-2 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                                        github_id
                                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                            : "bg-white text-gray-900"
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="mt-4">
                            <label htmlFor="email-address" className="block text-sm/6 font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email-address"
                                    name="email-address"
                                    value={email}
                                    disabled={!!email}
                                    type="email"
                                    readOnly
                                    className={`
                                    block w-full rounded-md px-3 py-2 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                                        email
                                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                            : "bg-white text-gray-900"
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Wallet Address Field */}
                        <div className="mt-4">
                            <label htmlFor="wallet-address" className="block text-sm/6 font-medium text-gray-700">
                                Wallet Address
                            </label>
                            <div className="mt-2">
                                <div className="flex gap-x-2">
                                    <div className="flex-1">
                                        <input
                                            id="wallet-address"
                                            name="wallet-address"
                                            type="text"
                                            value={currentWalletAddress}
                                            onChange={handleWalletAddressChange}
                                            placeholder="Enter your Ethereum wallet address (0x...)"
                                            disabled={!isEditing}
                                            className={`
                                            block w-full rounded-md px-3 py-2 text-base outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6
                                            ${
                                                isEditing
                                                    ? "bg-white text-gray-900 outline-gray-300 focus:outline-indigo-600"
                                                    : "bg-gray-100 text-gray-500 outline-gray-300 cursor-not-allowed"
                                            }
                                            ${validationError ? "outline-red-300 focus:outline-red-500" : ""}
                                            `}
                                        />
                                        {validationError && (
                                            <p className="text-xs text-red-600 mt-1">{validationError}</p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {!isEditing ? (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleEditClick}
                                            className="px-4 py-2"
                                        >
                                            Edit
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            {originalWalletAddress && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={handleCancelEdit}
                                                    disabled={pending}
                                                    className="px-3 py-2"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={!canSubmit}
                                                className="px-4 py-2"
                                            >
                                                {pending ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg
                                                            className="animate-spin h-4 w-4"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8v8z"
                                                            ></path>
                                                        </svg>
                                                        Saving...
                                                    </span>
                                                ) : (
                                                    "Save"
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {` Enter a valid Ethereum wallet address starting with "0x"`}
                                </p>
                            )}
                        </div>

                        {/* Form Status Messages */}
                        {state.message && (
                            <div
                                className={`mt-4 text-sm font-medium ${
                                    state.success ? "text-green-600" : "text-red-600"
                                }`}
                            >
                                {state.message}
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Wallet Status */}
                    <div className="mt-10 lg:mt-0">
                        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            {originalWalletAddress ? (
                                <div className="text-center">
                                    <div className="text-lg font-semibold text-gray-700 mb-2">Wallet Connected</div>
                                    <div className="text-sm text-gray-500 mb-4 break-all font-mono bg-gray-50 p-3 rounded border">
                                        {originalWalletAddress}
                                    </div>
                                    <div className="text-green-600 flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="font-medium">Verified</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <div className="text-4xl mb-3">🔗</div>
                                    <div className="text-lg font-medium text-gray-600">No Wallet Connected</div>
                                    <div className="text-sm mt-1">Add your wallet address to get started</div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
