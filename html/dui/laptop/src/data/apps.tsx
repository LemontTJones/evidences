import type React from "react";
import DNAApp from "../components/desktop/apps/dna/DNAApp";
import FingerprintApp from "../components/desktop/apps/fingerprint/FingerprintApp";
import DatabaseApp from "../components/desktop/apps/database/DatabaseApp";
import WiretapApp from "../components/desktop/apps/wiretap/WiretapApp";
import CasesApp from "../components/desktop/apps/cases/CasesApp";
import { useTranslation } from "../components/TranslationContext";
import fingerprintIcon from "../assets/app_icons/fingerprint.png";
import dnaIcon from "../assets/app_icons/dna.png";
import databaseIcon from "../assets/app_icons/database.png";
import wiretapIcon from "../assets/app_icons/wiretap.png";
import casesIcon from "../assets/app_icons/cases.png";

export interface App {
    name: string;
    icon: (width: string, height: string) => React.ReactNode;
    content: React.ReactNode;
}

export const AppsList = () => {
    const { t } = useTranslation();

    return [
        {
            name: t("laptop.desktop_screen.fingerprint_app.name"),
            icon: (width: string, height: string) => <img width={width} height={height} src={fingerprintIcon} draggable="false" />,
            content: <FingerprintApp />
        },
        {
            name: t("laptop.desktop_screen.dna_app.name"),
            icon: (width: string, height: string) => <img width={width} height={height} src={dnaIcon} draggable="false" />,
            content: <DNAApp />
        },
        {
            name: t("laptop.desktop_screen.database_app.name"),
            icon: (width: string, height: string) => <img width={width} height={height} src={databaseIcon} draggable="false" />,
            content: <DatabaseApp />
        },
        {
            name: t("laptop.desktop_screen.cases_app.name"),
            icon: (width: string, height: string) => <img width={width} height={height} src={casesIcon} draggable="false" />,
            content: <CasesApp />
        },
        {
            name: t("laptop.desktop_screen.wiretap_app.name"),
            icon: (width: string, height: string) => <img width={width} height={height} src={wiretapIcon} draggable="false" />,
            content: <WiretapApp />
        }
    ];
};
