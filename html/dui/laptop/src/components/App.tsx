import { useEffect, useState } from "react";
import LoginScreen from "./screens/LoginScreen";
import UserCursor from "./UserCursor";
import ScreenSaverScreen from "./screens/ScreenSaverScreen";
import DesktopScreen from "./screens/DesktopScreen";
import { useTranslation } from "./TranslationContext";

// In this class the whole custom operating system is rendered.

// Here, all different screens are specified.
export type ScreenType = "screensaver" | "login" | "desktop";

export interface Options {
    isWiretapAppEnabled: boolean;
    mayInterceptCalls: boolean;
    mayInterceptRadio: boolean;
    mayListenToSpyMicrophones: boolean;
}


export default function App() {
    const [screen, setScreen] = useState<ScreenType>("screensaver"); // set first screen to screen saver
    const [playerName, setPlayerName] = useState<string | undefined>();
    const [canAccess, setCanAccess] = useState<boolean>(false);
    const [options, setOptions] = useState<Options | undefined>();
    const [isMuted, setMuted] = useState<boolean>(false);
    const { setLang } = useTranslation();

    // switch to other screen.
    const switchScreen = (newScreen: ScreenType) => setScreen(newScreen);

    // mutes/unmutes the click sounds
    const mute = (muted: boolean) => setMuted(muted);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.action && event.data.action == "reset") {
                window.location.reload();
                return;
            }

            if (event.data.action && event.data.action == "switchScreen") {
                switchScreen(event.data.screen);
                return;
            }

            if (event.data.action && event.data.action == "focus") {
                setLang(event.data.language);
                if (event.data.playerName) setPlayerName(event.data.playerName);

                setCanAccess(event.data.playerName && event.data.canAccess);
                if (!event.data.canAccess) {
                    switchScreen("screensaver");
                }

                setOptions({
                    isWiretapAppEnabled: event.data.isWiretapAppEnabled,
                    mayInterceptCalls: event.data.mayInterceptCalls,
                    mayInterceptRadio: event.data.mayInterceptRadio,
                    mayListenToSpyMicrophones: event.data.mayListenToSpyMicrophones
                })
            }

            if (event.data.action && event.data.action == "keydown") {
                if (document.activeElement
                    && (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
                    simulateTyping(event.data.key, document.activeElement);
                }
            }

            function simulateTyping(char: string, input: HTMLInputElement | HTMLTextAreaElement) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    input instanceof HTMLInputElement ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype,
                    "value"
                )?.set;

                const cursorPosition = input.selectionStart ?? 0;
                const currentValue = input.value;

                let newChar = char;
                let newValue = currentValue;
                let newCursorPosition = cursorPosition;

                switch (char) {
                    case "Backspace":
                        if (cursorPosition > 0) {
                            newValue =
                                currentValue.substring(0, cursorPosition - 1) +
                                currentValue.substring(cursorPosition);
                            newCursorPosition -= 1;
                            break;
                        }
                        return;
                    case "Delete":
                        if (cursorPosition < currentValue.length) {
                            newValue =
                                currentValue.substring(0, cursorPosition) +
                                currentValue.substring(cursorPosition + 1);
                        }
                        break;
                    case "ArrowLeft":
                        newCursorPosition = Math.max(0, cursorPosition - 1);
                        input.scrollLeft -= 30;
                        break;
                    case "ArrowRight":
                        newCursorPosition = Math.min(currentValue.length, cursorPosition + 1);
                        input.scrollLeft += 30;
                        break;
                    default:
                        if (char == "Enter") {
                            newChar = "\n";
                        }

                        if (newChar.length > 1) {
                            return;
                        }

                        newValue = currentValue.substring(0, cursorPosition) + newChar + currentValue.substring(cursorPosition);
                        newCursorPosition += newChar.length;

                        if (input.maxLength && input.maxLength > 0 && newValue.length > input.maxLength) {
                            return;
                        }

                        break;
                }

                nativeInputValueSetter?.call(input, newValue);
                input.setSelectionRange(newCursorPosition, newCursorPosition);
                if (newChar.length == 1) input.scrollLeft += 30;
                if (newChar == "\n") input.scrollTop = input.scrollHeight;

                const inputEvent = new Event("input", { bubbles: true, cancelable: true });
                input.dispatchEvent(inputEvent);

                const keydownEvent = new KeyboardEvent("keydown", {
                    key: char,
                    bubbles: true,
                    cancelable: true
                });
                input.dispatchEvent(keydownEvent);
            }
        };

        window.addEventListener("message", handleMessage);

        return () => window.removeEventListener("message", handleMessage);
    }, []);


    return <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
        <UserCursor muted={isMuted} />
        {screen === "screensaver" && <ScreenSaverScreen switchScreen={switchScreen} />}
        {screen === "login" && <LoginScreen playerName={playerName} canAccess={canAccess} switchScreen={switchScreen} />}
        {screen === "desktop" && <DesktopScreen playerName={playerName} options={options} switchScreen={switchScreen} mute={mute} />}
    </div>;
}