"use server";

import { auth } from "@/auth";
import { prisma } from "@repo/db/prisma";
import { isAddress } from "viem";
import { revalidatePath } from "next/cache";

export async function createOrUpdateProfile(
  prevState: unknown,
  formData: FormData
) {
  try {
    // Get and validate wallet address
    const walletAddress = formData.get("wallet-address")?.toString()?.trim();
    if (!walletAddress || walletAddress.length === 0) {
      return {
        success: false,
        message: "Wallet address is required",
      };
    }

    // Validate wallet address format using viem
    if (!isAddress(walletAddress)) {
      return {
        success: false,
        message: "Please enter a valid Ethereum wallet address",
      };
    }

    // Check authentication
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return {
        success: false,
        message: "You must be logged in to update your profile",
      };
    }

    // Check if wallet address is already used by another user
    const existingProfile = await prisma.profile.findFirst({
      where: {
        walletAddress: walletAddress,
        userId: {
          not: session.user.id,
        },
      },
    });

    if (existingProfile) {
      return {
        success: false,
        message:
          "This wallet address is already associated with another account",
      };
    }
    // Create or update profile
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: { walletAddress },
      create: { userId: session.user.id, walletAddress },
    });
    // Revalidate the page to refresh server-side data
    revalidatePath("/");
    return {
      success: true,
      message: "Wallet address updated successfully!",
      profile,
    };
  } catch (error) {
    console.error("Error updating profile:", error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          message:
            "This wallet address is already associated with another account",
        };
      }
    }

    return {
      success: false,
      message:
        "An error occurred while updating your profile. Please try again.",
    };
  }
}
