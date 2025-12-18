import { useEffect, useRef, useState } from "react";
import AudioWave from "./AudioWave";
import { useTranslation } from "../../../TranslationContext";
import type { Observation } from "./WiretapApp";
import { useAppContext } from "../../../../hooks/useAppContext";
import styles from "../../../../css/RunningWiretap.module.css";

interface RunningWiretapProps {
    observation: Observation;
    onClose: () => void;
}

export default function RunningWiretap(props: RunningWiretapProps) {
    const { t } = useTranslation();
    const appContext = useAppContext();
    const [protocol, setProtocol] = useState<string>("");
    const currentProtocol = useRef<string>("");
    const involvedTargets = useRef<string[]>([]);
    const [activeTargets, setActiveTargets] = useState<number[]>([]);

    if (props.observation.type == "ObservableCall") {
        useEffect(() => {
            Object.values(props.observation.targets!).filter((target) => target).forEach((target) => {
                if (!involvedTargets.current.includes(target.name)) {
                    involvedTargets.current.push(target.name);
                }
            });
        }, [props.observation]);
    }

    useEffect(() => { currentProtocol.current = protocol; }, [protocol]);

    const startObservation = () => {
        const identifier = props.observation.type == "ObservableSpyMicrophone" ? "label" : "channel";

        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                name: `evidences:observe${props.observation.type}`,
                arguments: {
                    [identifier]: props.observation[identifier]
                }
            })
        });
    };

    const stopObservation = () => {
        const identifier = props.observation.type == "ObservableSpyMicrophone" ? "label" : "channel";

        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                name: `evidences:ignore${props.observation.type}`,
                arguments: {
                    [identifier]: props.observation[identifier]
                }
            })
        });
    };

    useEffect(() => {
        const startedAt = Date.now();

        startObservation();
        
        const handleMessage = (event: MessageEvent) => {
            if (!event.data.action) return;

            if (event.data.action == "focus") {
                startObservation();
                return;
            }

            if (event.data.action == "unfocus") {
                stopObservation();
                return;
            }

            // Retrieve updates regarding the active targets
            if (event.data.action == "setAudioWaveActive" && event.data.target) {
                if (event.data.active) {
                    setActiveTargets(prev => [...prev, event.data.target])
                } else {
                    setActiveTargets(prev => prev.filter((target) => target != event.data.target))
                }
            }
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);

            stopObservation();

            fetch(`https://${location.host}/triggerServerCallback`, {
                method: "post",
                headers: {
                    "Content-Type": "application/json; charset=UTF-8",
                },
                body: JSON.stringify({
                    name: "evidences:storeWiretap",
                    arguments: {
                        type: props.observation.type,
                        startedAt: startedAt,
                        endedAt: Date.now(),
                        // The playerName is never undefined, otherwise the player can't even login to the laptop
                        observer: appContext.playerName || "",
                        target: props.observation.type == "ObservableCall"
                                    ? involvedTargets.current.join(", ")
                                    : props.observation.type == "ObservableRadioFreq"
                                        ? props.observation.channel
                                        : props.observation.label,
                        protocol: currentProtocol.current
                    }
                })
            }).then(() => props.onClose());
        };
    }, []);

    const getFormattedTime = (): string => {
        return new Date().toLocaleTimeString(t("laptop.screen_saver.date_locales"), { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    };

    const handleFocus = () => {
        if (protocol.length == 0) {
            setProtocol(prev => `[${getFormattedTime()}] ${prev}`)
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();
            setProtocol(prev => `${prev}[${getFormattedTime()}] `)
        }
    };

    return <div style={{ width: "100%", height: "100%", padding: "20px", display: "flex", flexDirection: "column", gap: "20px", background: "#c0c0c0ff" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {props.observation.type == "ObservableCall"
                ? Object.values(props.observation.targets!).filter((target) => target).map((target) => 
                    <div key={target.playerId} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <p style={{ fontSize: "30px", whiteSpace: "nowrap" }}>{target.name}</p>
                        <AudioWave active={activeTargets.includes(target.playerId)} />
                    </div>)
                : <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {(props.observation.type != "ObservableSpyMicrophone") &&
                        <p style={{ fontSize: "30px", whiteSpace: "nowrap" }}>{props.observation.channel} MHz</p>
                    }
                    <AudioWave active={activeTargets.length > 0} />
                </div>
            }
        </div>
        <div style={{ display: "flex", flexGrow: 1 }}>
            <textarea
                className={`${styles.input} ${styles.textarea} textable`}
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
            />
        </div>
    </div>;
}