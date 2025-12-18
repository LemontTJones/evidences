import { useState } from "react";
import type { Case, CasesResponse } from "./CasesApp";
import { useTranslation } from "../../../TranslationContext";
import Spinner from "../../../atoms/Spinner";
import ChevronSVG from "../database/ChevronSVG";
import styles from "../../../../css/CasesList.module.css";

interface CasesListProps {
    data: CasesResponse | null;
    loading: boolean;
    error: boolean;
    searchText: string;
    statusFilter: string;
    page: number;
    maxPages: number;
    onSearchChange: (text: string) => void;
    onStatusFilterChange: (status: string) => void;
    onPageChange: (page: number) => void;
    onCaseSelect: (caseItem: Case) => void;
    onCreateCase: (caseNumber: string, title: string, description: string, assignedTo: string) => Promise<void>;
    onDeleteCase: (caseId: number) => Promise<void>;
}

export default function CasesList(props: CasesListProps) {
    const { t } = useTranslation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCaseNumber, setNewCaseNumber] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newAssignedTo, setNewAssignedTo] = useState("");

    const handleCreateCase = () => {
        if (!newCaseNumber || !newTitle) return;

        props.onCreateCase(newCaseNumber, newTitle, newDescription, newAssignedTo).then(() => {
            setShowCreateModal(false);
            setNewCaseNumber("");
            setNewTitle("");
            setNewDescription("");
            setNewAssignedTo("");
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "open": return "#4CAF50";
            case "active": return "#2196F3";
            case "closed": return "#9E9E9E";
            case "archived": return "#607D8B";
            default: return "#9E9E9E";
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    return <div className={styles.container} style={{ background: "#c0c0c0ff" }}>
        {/* Header */}
        <div className={styles.header}>
            <h2 className={styles.title}>
                {t("laptop.desktop_screen.cases_app.name")}
            </h2>
            <button
                onClick={() => setShowCreateModal(true)}
                className={`${styles.create__button} hoverable`}
            >
                {t("laptop.desktop_screen.cases_app.create_case")}
            </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
            <input
                type="text"
                className={`${styles.search__input} textable`}
                placeholder={t("laptop.desktop_screen.cases_app.search_placeholder")}
                value={props.searchText}
                onChange={(e) => props.onSearchChange(e.target.value)}
            />
            <select
                value={props.statusFilter}
                onChange={(e) => props.onStatusFilterChange(e.target.value)}
                className={styles.status__select}
            >
                <option value="all">{t("laptop.desktop_screen.cases_app.status_all")}</option>
                <option value="open">{t("laptop.desktop_screen.cases_app.status_open")}</option>
                <option value="active">{t("laptop.desktop_screen.cases_app.status_active")}</option>
                <option value="closed">{t("laptop.desktop_screen.cases_app.status_closed")}</option>
                <option value="archived">{t("laptop.desktop_screen.cases_app.status_archived")}</option>
            </select>
        </div>

        {/* Cases List */}
        <div className={styles.cases__container}>
            {props.loading && (
                <div className={styles.loading__container}>
                    <Spinner black />
                </div>
            )}

            {props.error && !props.loading && (
                <div className={styles.error__message}>
                    <div className={styles.error__content}>
                        <svg width="100px" height="100px" fill="black" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                        </svg>
                        <p className={`${styles.message__text} ${styles.error__text}`}>{t("laptop.desktop_screen.cases_app.error_loading")}</p>
                    </div>
                </div>
            )}

            {!props.loading && !props.error && props.data && props.data.cases.length === 0 && (
                <div className={styles.empty__message}>
                    <div className={styles.empty__content}>
                        <svg width="100px" height="100px" fill="black" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path d="M280-160v-441q0-33 24-56t57-23h439q33 0 56.5 23.5T880-600v320L680-80H360q-33 0-56.5-23.5T280-160ZM81-710q-6-33 13-59.5t52-32.5l434-77q33-6 59.5 13t32.5 52l10 54h-82l-7-40-433 77 40 226v279q-16-9-27.5-24T158-276L81-710Zm279 110v440h280v-160h160v-280H360Zm220 220Z"/>
                        </svg>
                        <p className={styles.message__text}>{t("laptop.desktop_screen.cases_app.no_cases")}</p>
                    </div>
                </div>
            )}

            {!props.loading && !props.error && props.data && props.data.cases.map((caseItem) => (
                <div
                    key={caseItem.id}
                    onClick={() => props.onCaseSelect(caseItem)}
                    className={`${styles.case__item} hoverable`}
                >
                    <div className={styles.case__header}>
                        <div>
                            <strong className={styles.case__number}>
                                {caseItem.case_number}
                            </strong>
                            <span
                                className={styles.status__badge}
                                style={{ background: getStatusColor(caseItem.status) }}
                            >
                                {caseItem.status.toUpperCase()}
                            </span>
                        </div>
                        <span className={styles.case__date}>
                            {formatDate(caseItem.updated_at)}
                        </span>
                    </div>
                    <div className={styles.case__title}>
                        {caseItem.title}
                    </div>
                    <div className={styles.case__assigned}>
                        {t("laptop.desktop_screen.cases_app.assigned_to")}: {caseItem.assigned_to || t("laptop.desktop_screen.cases_app.unassigned")}
                    </div>
                </div>
            ))}
        </div>

        {/* Pagination */}
        {!props.loading && !props.error && props.data && props.maxPages > 1 && (
            <div className={styles.pagination}>
                <button
                    onClick={() => props.onPageChange(props.page - 1)}
                    disabled={props.page <= 1}
                    className={`${styles.switchpage__button} ${props.page <= 1 ? "blocked" : "hoverable"}`}
                >
                    <ChevronSVG style={{ transform: "rotate(90deg)" }} width="35px" height="35px" />
                </button>

                <span className={styles.page__text}>
                    {t("laptop.desktop_screen.database_app.page", props.page, props.maxPages)}
                </span>

                <button
                    onClick={() => props.onPageChange(props.page + 1)}
                    disabled={props.page >= props.maxPages}
                    className={`${styles.switchpage__button} ${props.page >= props.maxPages ? "blocked" : "hoverable"}`}
                >
                    <ChevronSVG style={{ transform: "rotate(-90deg)" }} width="35px" height="35px" />
                </button>
            </div>
        )}

        {/* Create Case Modal */}
        {showCreateModal && (
            <div className={styles.modal__overlay}>
                <div className={styles.modal__content}>
                    <h3 className={styles.modal__title}>
                        {t("laptop.desktop_screen.cases_app.create_new_case")}
                    </h3>

                    <div className={styles.modal__form}>
                        <div className={styles.form__group}>
                            <label className={styles.form__label}>
                                {t("laptop.desktop_screen.cases_app.case_number")} *
                            </label>
                            <input
                                type="text"
                                value={newCaseNumber}
                                onChange={(e) => setNewCaseNumber(e.target.value)}
                                className={`${styles.form__input} textable`}
                            />
                        </div>

                        <div className={styles.form__group}>
                            <label className={styles.form__label}>
                                {t("laptop.desktop_screen.cases_app.title")} *
                            </label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className={`${styles.form__input} textable`}
                            />
                        </div>

                        <div className={styles.form__group}>
                            <label className={styles.form__label}>
                                {t("laptop.desktop_screen.cases_app.description")}
                            </label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows={4}
                                className={`${styles.form__textarea} textable`}
                            />
                        </div>

                        <div className={styles.form__group}>
                            <label className={styles.form__label}>
                                {t("laptop.desktop_screen.cases_app.assigned_to")}
                            </label>
                            <input
                                type="text"
                                value={newAssignedTo}
                                onChange={(e) => setNewAssignedTo(e.target.value)}
                                className={`${styles.form__input} textable`}
                            />
                        </div>

                        <div className={styles.modal__actions}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className={`${styles.cancel__button} hoverable`}
                            >
                                {t("laptop.desktop_screen.cases_app.cancel")}
                            </button>
                            <button
                                onClick={handleCreateCase}
                                disabled={!newCaseNumber || !newTitle}
                                className={`${styles.submit__button} hoverable`}
                            >
                                {t("laptop.desktop_screen.cases_app.create")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>;
}
