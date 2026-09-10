import React from "react";
import { useDeskThingData } from "./hooks/useDeskThingData";
import { Header } from "./components/Header";
import { HeroGlucose } from "./components/HeroGlucose";
import { GlucoseChart } from "./components/GlucoseChart";

export const App: React.FC = () => {
    const data = useDeskThingData();

    return (
        <main className="fixed inset-0 w-full h-full bg-black text-white p-4 sm:p-6 flex flex-col justify-between overflow-hidden select-none font-sans">
            <section className="flex-shrink-0">
                <Header />
            </section>

            <section className="flex-shrink-0">
                <HeroGlucose data={data} />
            </section>

            <section className="w-full flex-1 min-h-0 flex flex-col justify-end pt-2">
                <GlucoseChart
                    dataPoints={data.dataPoints}
                    forecastPoints={data.forecastPoints}
                    statusColor={data.statusColor}
                    units={data.units}
                />
            </section>
        </main>
    );
};

export default App;