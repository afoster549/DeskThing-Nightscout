import React from "react";
import { useClock } from "../hooks/useClock";

export const Header: React.FC = () => {
    const time = useClock();

    return (
        <header className="flex justify-end items-center">
            <div className="text-3xl font-bold tracking-tight text-neutral-300 font-mono">
                {time}
            </div>
        </header>
    );
};