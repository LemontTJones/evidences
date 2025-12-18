import type { Interception } from "./InterceptionChooser";
import { useTranslation } from "../../../TranslationContext";
import styles from "../../../../css/WiretapProtocol.module.css";

interface WiretapProtocolProps {
    interception: Interception;
}


export default function WiretapProtocol(props: WiretapProtocolProps) {
    const { t } = useTranslation();
 
    const formatTime = (dateMillis: number): string => {
        return new Date(dateMillis).toLocaleTimeString(t("laptop.screen_saver.date_locales"), { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    };
 
    return <div style={{ width: "100%", height: "100%", padding: "20px", display: "flex", flexDirection: "column", gap: "20px", background: "#c0c0c0ff" }}>
        <div className={styles.protocol}>
            <p style={{ fontSize: "33px" }}>
                [{formatTime(props.interception.startedAt)}]
                {" "}
                <span style={{ fontSize: "33px", fontStyle: "italic" }}>{t("laptop.desktop_screen.wiretap_app.protocol_popup.observation_started")}</span>
            </p>
            {props.interception.protocol && props.interception.protocol.split("\n").map((line) => <p style={{ fontSize: "33px" }}>{line}</p>)}
            <p style={{ fontSize: "33px" }}>
                [{formatTime(props.interception.endedAt)}]
                {" "}
                <span style={{ fontSize: "33px", fontStyle: "italic" }}>{t("laptop.desktop_screen.wiretap_app.protocol_popup.observation_ended")}</span>
            </p>
        </div>
    </div>;
}