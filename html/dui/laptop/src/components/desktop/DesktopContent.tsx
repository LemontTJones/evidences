import AppIcons from "./AppIcons";
import MoveableApp from "./MoveableApp";
import type { OpenApp } from "../screens/DesktopScreen";
import { AppsList, type App } from "../../data/apps";
import { useRef } from "react";
import type { Options } from "../App";
import { useTranslation } from "../TranslationContext";


// Props parsed by the parent.
interface DesktopContentProps {
    playerName: string | undefined;
    options: Options | undefined;
    openApps: OpenApp[];
    openApp: (app: App) => void;
    closeApp: (app: OpenApp) => void;
    focusApp: (app: OpenApp) => void;
    onMinimize: (app: OpenApp) => void;
    openPopUp: (parentApp: OpenApp, name: string, content: React.ReactNode) => void;
}


// Renders the content of the desktop.
export default function DesktopContent(props: DesktopContentProps) {
    const { t } = useTranslation();
    const lastFocusedAppPosition = useRef({ x: 0, y: 0 });
    const defaultPosition = { ...lastFocusedAppPosition.current };
    const filteredAppsList = AppsList().filter((app) => {
        if (app.name == t("laptop.desktop_screen.wiretap_app.name")) {
            return props.options?.isWiretapAppEnabled || false;
        }

        return true;
    });

    return <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <AppIcons apps={filteredAppsList} openApp={props.openApp} />
        {props.openApps.map((app) => {
            const width = app.isPopUp ? 1000 : 1400;
            const height = app.isPopUp ? 600 : 850;

            defaultPosition.x += 50;
            defaultPosition.y += 50;

            if (defaultPosition.x + width >= 1920) {
                defaultPosition.x = 50;
                defaultPosition.y = 50;
            }

            return <MoveableApp
                key={app.name}
                app={app}
                openPopUp={(name, content) => props.openPopUp(app, name, content)}
                isPopUp={app.isPopUp}
                defaultPosition={defaultPosition}
                width={width}
                height={height}
                playerName={props.playerName}
                options={props.options}
                onClose={props.closeApp}
                onMinimize={props.onMinimize}
                onFocus={props.focusApp}
                onUpdatePosition={(x, y) => {
                    lastFocusedAppPosition.current.x = x;
                    lastFocusedAppPosition.current.y = y;
                }} />
        })}
    </div>;
}