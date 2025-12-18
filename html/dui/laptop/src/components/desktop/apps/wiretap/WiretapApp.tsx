import { useEffect, useRef, useState } from "react";
import InterceptionChooser from "./InterceptionChooser";
import { useAppContext } from "../../../../hooks/useAppContext";
import RunningWiretap from "./RunningWiretap";
import { useTranslation } from "../../../TranslationContext";
import useLocalStorage from "../../../../hooks/useLocalStorage";
import styles from "../../../../css/WiretapApp.module.css";
import { sha256 } from "../../../../utils/hash";

export interface Observation {
    type: "ObservableCall" | "ObservableRadioFreq" | "ObservableSpyMicrophone";
    label?: string;
    channel?: number;
    targets?: {
        [playerId: number]: {
            playerId: number;
            name: string;
        }
    }
}

export default function WiretapApp() {
    const { t } = useTranslation();
    const appContext = useAppContext();

    const [displayPopUp, setDisplayPopUp] = useLocalStorage<string>("evidences_wiretapapp_warning", "");
    const [computetHash, setComputetHash] = useState<string | undefined>(undefined);

    const [activeCalls, setActiveCalls] = useState<{ [channel: number]: Observation }>({});
    const [spyMicrophones, setSpyMicrophones] = useState<{ [label: string]: Observation }>({});
    const [interceptionChooserReloadKey, setInterceptionChooserReloadKey] = useState<number>(0);

    const observation = useRef<Observation | null>(null);
    const [radioFrequency, setRadioFrequency] = useState<string>("");

    useEffect(() => {
        async function runHashing() {
            const hashed = await sha256(t("laptop.desktop_screen.wiretap_app.warning_popup.warning"));
            setComputetHash(hashed)
        }
        runHashing();
    }, []);

    const startInterception = (newObservation: Observation) => {
        observation.current = newObservation;

        appContext.openPopUp(t(`laptop.desktop_screen.wiretap_app.running_observation_popup.${newObservation.type}`, newObservation.channel ?? newObservation.label ?? ""), <RunningWiretap observation={newObservation} onClose={() => {
            observation.current = null;
            setInterceptionChooserReloadKey(prev => prev + 1);
        }} />);

        // Set the current observation to null, if all participants left the call
        // This prevents further updates to the RunningWiretap popup
        if (observation.current.type == "ObservableCall" && Object.keys(newObservation.targets!).length == 0) {
            observation.current = null;
        }
    };

    useEffect(() => {
        if (observation.current && observation.current.type == "ObservableCall") {
            const updatedObservation = observation.current.channel! in activeCalls   // Check if currently observed call is in updated activeCalls (= has not ended)
                ? activeCalls[observation.current.channel!]                          // If so, use the new call from the list (-> update participants in popup)
                : { ...observation.current, targets: {} };                           // Else, use the previous state of the call, but clear the list of participants
            
            startInterception(updatedObservation);
        }
    }, [activeCalls]);

    const startRadioObservation = () => {
        const frequency = parseFloat(radioFrequency);

        if (isNaN(frequency) || !isFinite(frequency)) return;

        const observation: Observation = {
            type: "ObservableRadioFreq",
            channel: frequency,
            targets: []
        }

        startObservation(observation);
    };

    const startObservation = (newObservation: Observation) => {
        if (observation.current) return;
        startInterception(newObservation);
    }

    useEffect(() => {
        // Retrieve active calls when opening the app
        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                name: "evidences:getActiveCalls"
            })
        }).then(response => response.json()).then(response => {
            if (response) setActiveCalls(response);
        });

        // Retrieve list of spy microphones
        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                name: "evidences:getSpyMicrophones"
            })
        }).then(response => response.json()).then(response => {
            if (response) setSpyMicrophones(response);
        });

        const handleMessage = (event: MessageEvent) => {
            // Retrieve updates regarding the active calls
            if (event.data.action && event.data.action == "updateActiveCalls") {
                if (event.data.activeCalls) setActiveCalls(event.data.activeCalls);
            }
            
            // Retrieve updates regarding the spy microphones
            if (event.data.action && event.data.action == "updateSpyMicrophones") {
                if (event.data.spyMicrophones) setSpyMicrophones(event.data.spyMicrophones);
            }
        };

        window.addEventListener("message", handleMessage);

        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const handleRadioFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const decimalRegex = /(\d*\.\d+|\d+\.?\d*)/;
        const match = e.target.value.match(decimalRegex);

        setRadioFrequency(match ? match[0] : "");
    };

    if (!computetHash) {
        return <div style={{ width: "100%", height: "100%", display: "flex", background: "#c0c0c0ff" }}></div>
    }

    return <div style={{ width: "100%", height: "100%", display: "flex", background: "#c0c0c0ff" }}>
        {displayPopUp != computetHash && <div style={{ position: "absolute", width: "100%", height: "100%", background: "rgba(0, 0, 0, 0.5)", zIndex: "5", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ padding: "40px", width: "75%", background: "white", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", border: "2px solid rgba(255, 255, 255, 0.8)", borderRadius: "16px" }}>
                <div style={{ display: "flex", width: "100%", gap: "20px" }}>
                    <div style={{ paddingRight: "20px" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="75px" height="75px" viewBox="0 -960 960 960" fill="#ff8800ff"><path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/></svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <p style={{ fontSize: "30px", fontWeight: "bold" }}>{t("laptop.desktop_screen.wiretap_app.warning_popup.title")}</p>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {t("laptop.desktop_screen.wiretap_app.warning_popup.warning").split("\n").map((line) =>
                                <p style={{ fontSize: "30px" }}>{line}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "20px" }}>
                    <button onClick={() => setDisplayPopUp(computetHash)} className={`${styles.button} hoverable`} style={{ fontSize: "30px" }}>{t("laptop.desktop_screen.wiretap_app.warning_popup.accept_button")}</button>
                </div>
            </div>
        </div>}
        <div style={{ width: "100%", height: "100%", display: "flex", gap: "20px", padding: "20px" }}>
            <div style={{ width: "50%", height: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ width: "100%", flexGrow: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ width: "100%", height: "50%", padding: "30px", display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255, 255, 255, 0.2)", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", border: "2px solid rgba(255, 255, 255, 0.8)", borderRadius: "16px" }}>
                        <p style={{ fontSize: "20px", lineHeight: "20px", margin: 0, textTransform: "uppercase" }}>{t("laptop.desktop_screen.wiretap_app.phone_calls.header")}</p>
                        <div className={styles.observation__chooser}>
                            {appContext.options?.mayInterceptCalls
                                ? Object.values(activeCalls).length == 0
                                    ? <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="30px" width="30px" viewBox="0 -960 960 960" fill="black"><path d="M162-120q-18 0-30-12t-12-30v-162q0-13 9-23.5t23-14.5l138-28q14-2 28.5 2.5T342-374l94 94q38-22 72-48.5t65-57.5q33-32 60.5-66.5T681-524l-97-98q-8-8-11-19t-1-27l26-140q2-13 13-22.5t25-9.5h162q18 0 30 12t12 30q0 125-54.5 247T631-329Q531-229 409-174.5T162-120Zm556-480q17-39 26-79t14-81h-88l-18 94 66 66ZM360-244l-66-66-94 20v88q41-3 81-14t79-28Zm358-356ZM360-244Z"/></svg>
                                        <p style={{ fontSize: "20px", lineHeight: "20px", margin: 0 }}>{t("laptop.desktop_screen.wiretap_app.phone_calls.no_calls_running")}</p>
                                    </div>
                                    : Object.values(activeCalls).map((call) =>
                                        <div key={call.channel} className={`${styles.observation} hoverable`} onClick={() => startObservation(call)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" height="50px" width="50px" viewBox="0 -960 960 960" fill="black"><path d="M162-120q-18 0-30-12t-12-30v-162q0-13 9-23.5t23-14.5l138-28q14-2 28.5 2.5T342-374l94 94q38-22 72-48.5t65-57.5q33-32 60.5-66.5T681-524l-97-98q-8-8-11-19t-1-27l26-140q2-13 13-22.5t25-9.5h162q18 0 30 12t12 30q0 125-54.5 247T631-329Q531-229 409-174.5T162-120Zm556-480q17-39 26-79t14-81h-88l-18 94 66 66ZM360-244l-66-66-94 20v88q41-3 81-14t79-28Zm358-356ZM360-244Z"/></svg>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                {Object.values(call.targets!).filter((target) => target).map((target) => <p key={target.playerId} style={{ fontSize: "30px" }}>{target.name}</p>)}
                                            </div>
                                        </div>
                                    )
                                : <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="30px" width="30px" viewBox="0 -960 960 960" fill="black"><path d="M162-120q-18 0-30-12t-12-30v-162q0-13 9-23.5t23-14.5l138-28q14-2 28.5 2.5T342-374l94 94q38-22 72-48.5t65-57.5q33-32 60.5-66.5T681-524l-97-98q-8-8-11-19t-1-27l26-140q2-13 13-22.5t25-9.5h162q18 0 30 12t12 30q0 125-54.5 247T631-329Q531-229 409-174.5T162-120Zm556-480q17-39 26-79t14-81h-88l-18 94 66 66ZM360-244l-66-66-94 20v88q41-3 81-14t79-28Zm358-356ZM360-244Z"/></svg>
                                    <p style={{ fontSize: "20px", lineHeight: "20px", margin: 0 }}>{t("laptop.desktop_screen.wiretap_app.phone_calls.lacking_permissions")}</p>
                                </div>
                            }
                        </div>
                    </div>

                    <div style={{ width: "100%", height: "50%", padding: "30px", display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255, 255, 255, 0.2)", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", border: "2px solid rgba(255, 255, 255, 0.8)", borderRadius: "16px" }}>
                        <p style={{ fontSize: "20px", lineHeight: "20px", margin: 0, textTransform: "uppercase" }}>{t("laptop.desktop_screen.wiretap_app.spy_microphones.header")}</p>
                        <div className={styles.observation__chooser}>
                            {appContext.options?.mayListenToSpyMicrophones
                                ? Object.values(spyMicrophones).length == 0
                                    ? <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" fill="black" viewBox="0 -960 960 960"><path d="M480-200q66 0 113-47t47-113v-160q0-66-47-113t-113-47q-66 0-113 47t-47 113v160q0 66 47 113t113 47Zm-80-120h160v-80H400v80Zm0-160h160v-80H400v80Zm80 40Zm0 320q-65 0-120.5-32T272-240H160v-80h84q-3-20-3.5-40t-.5-40h-80v-80h80q0-20 .5-40t3.5-40h-84v-80h112q14-23 31.5-43t40.5-35l-64-66 56-56 86 86q28-9 57-9t57 9l88-86 56 56-66 66q23 15 41.5 34.5T688-640h112v80h-84q3 20 3.5 40t.5 40h80v80h-80q0 20-.5 40t-3.5 40h84v80H688q-32 56-87.5 88T480-120Z"/></svg>
                                        <p style={{ fontSize: "20px", lineHeight: "20px", margin: 0 }}>{t("laptop.desktop_screen.wiretap_app.spy_microphones.no_spy_microphones_placed")}</p>
                                    </div>
                                    : Object.values(spyMicrophones).map((spyMicrohpone) =>
                                        <div key={spyMicrohpone.label} className={`${styles.observation} hoverable`} onClick={() => startObservation(spyMicrohpone)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" fill="black" viewBox="0 -960 960 960"><path d="M480-200q66 0 113-47t47-113v-160q0-66-47-113t-113-47q-66 0-113 47t-47 113v160q0 66 47 113t113 47Zm-80-120h160v-80H400v80Zm0-160h160v-80H400v80Zm80 40Zm0 320q-65 0-120.5-32T272-240H160v-80h84q-3-20-3.5-40t-.5-40h-80v-80h80q0-20 .5-40t3.5-40h-84v-80h112q14-23 31.5-43t40.5-35l-64-66 56-56 86 86q28-9 57-9t57 9l88-86 56 56-66 66q23 15 41.5 34.5T688-640h112v80h-84q3 20 3.5 40t.5 40h80v80h-80q0 20-.5 40t-3.5 40h84v80H688q-32 56-87.5 88T480-120Z"/></svg>
                                            <p style={{ fontSize: "30px" }}>{spyMicrohpone.label}</p>
                                        </div>
                                    )
                                : <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" fill="black" viewBox="0 -960 960 960"><path d="M480-200q66 0 113-47t47-113v-160q0-66-47-113t-113-47q-66 0-113 47t-47 113v160q0 66 47 113t113 47Zm-80-120h160v-80H400v80Zm0-160h160v-80H400v80Zm80 40Zm0 320q-65 0-120.5-32T272-240H160v-80h84q-3-20-3.5-40t-.5-40h-80v-80h80q0-20 .5-40t3.5-40h-84v-80h112q14-23 31.5-43t40.5-35l-64-66 56-56 86 86q28-9 57-9t57 9l88-86 56 56-66 66q23 15 41.5 34.5T688-640h112v80h-84q3 20 3.5 40t.5 40h80v80h-80q0 20-.5 40t-3.5 40h84v80H688q-32 56-87.5 88T480-120Z"/></svg>
                                    <p style={{ fontSize: "20px", lineHeight: "20px", margin: 0 }}>{t("laptop.desktop_screen.wiretap_app.spy_microphones.lacking_permissions")}</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
                
                <div style={{ width: "100%", padding: "30px", display: "flex", flexDirection: "column", gap: "5px", background: "rgba(255, 255, 255, 0.2)", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", border: "2px solid rgba(255, 255, 255, 0.8)", borderRadius: "16px" }}>
                    <p style={{ fontSize: "20px", textTransform: "uppercase"}}>{t("laptop.desktop_screen.wiretap_app.radio.header")}</p>
                    {appContext.options?.mayInterceptRadio
                        ? <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px" }}>
                            <input className="textable" style={{ borderRadius: "10px", minWidth: "0", flexGrow: 1, background: "#c0c0c0ff", border: "unset", fontSize: "35px", padding: "10px" }} placeholder="99.0 MHz" value={radioFrequency} onChange={handleRadioFrequencyChange} />
                            <div className={`${styles.button} hoverable`} onClick={startRadioObservation}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" fill="black" viewBox="0 -960 960 960"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
                            </div>
                        </div>
                        : <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "10px" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" fill="black" viewBox="0 -960 960 960"><path d="M196-276q-57-60-86.5-133T80-560q0-78 29.5-151T196-844l48 48q-48 48-72 110.5T148-560q0 63 24 125.5T244-324l-48 48Zm96-96q-39-39-59.5-88T212-560q0-51 20.5-100t59.5-88l48 48q-30 27-45 64t-15 76q0 36 15 73t45 67l-48 48ZM280-80l135-405q-16-14-25.5-33t-9.5-42q0-42 29-71t71-29q42 0 71 29t29 71q0 23-9.5 42T545-485L680-80h-80l-26-80H387l-27 80h-80Zm133-160h134l-67-200-67 200Zm255-132-48-48q30-27 45-64t15-76q0-36-15-73t-45-67l48-48q39 39 58 88t22 100q0 51-20.5 100T668-372Zm96 96-48-48q48-48 72-110.5T812-560q0-63-24-125.5T716-796l48-48q57 60 86.5 133T880-560q0 78-28 151t-88 133Z"/></svg>
                            <p style={{ fontSize: "20px", lineHeight: "20px", margin: 0 }}>{t("laptop.desktop_screen.wiretap_app.radio.lacking_permissions")}</p>
                        </div>
                    }
                </div>
            </div>

            <InterceptionChooser reloadKey={interceptionChooserReloadKey} />
        </div>
</div>;
}