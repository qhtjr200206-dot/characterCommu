"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn btn-danger w-full mt-sm"
            style={{
                padding: "8px 12px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                borderRadius: "var(--border-radius-md)",
            }}
        >
            로그아웃
        </button>
    );
}
