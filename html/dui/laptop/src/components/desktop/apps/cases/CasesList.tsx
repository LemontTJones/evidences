import { useState } from "react";
import type { Case, CasesResponse } from "./CasesApp";
import { useTranslation } from "../../../TranslationContext";
import Spinner from "../../../atoms/Spinner";

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

    return <div style={{ width: "100%", height: "100%", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontFamily: "monospace", fontSize: "24px" }}>
                {t("laptop.desktop_screen.cases_app.name")}
            </h2>
            <button
                onClick={() => setShowCreateModal(true)}
                style={{
                    padding: "10px 20px",
                    background: "#008080",
                    color: "white",
                    border: "2px solid #000",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    boxShadow: "2px 2px 0px #000"
                }}
            >
                {t("laptop.desktop_screen.cases_app.create_case")}
            </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center", background: "white", padding: "15px", border: "2px solid #000" }}>
            <input
                type="text"
                placeholder={t("laptop.desktop_screen.cases_app.search_placeholder")}
                value={props.searchText}
                onChange={(e) => props.onSearchChange(e.target.value)}
                style={{
                    flex: 1,
                    padding: "8px",
                    border: "2px solid #000",
                    fontFamily: "monospace",
                    fontSize: "14px"
                }}
            />
            <select
                value={props.statusFilter}
                onChange={(e) => props.onStatusFilterChange(e.target.value)}
                style={{
                    padding: "8px",
                    border: "2px solid #000",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    background: "white"
                }}
            >
                <option value="all">{t("laptop.desktop_screen.cases_app.status_all")}</option>
                <option value="open">{t("laptop.desktop_screen.cases_app.status_open")}</option>
                <option value="active">{t("laptop.desktop_screen.cases_app.status_active")}</option>
                <option value="closed">{t("laptop.desktop_screen.cases_app.status_closed")}</option>
                <option value="archived">{t("laptop.desktop_screen.cases_app.status_archived")}</option>
            </select>
        </div>

        {/* Cases List */}
        <div style={{ flex: 1, overflow: "auto", background: "white", border: "2px solid #000", padding: "15px" }}>
            {props.loading && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Spinner />
                </div>
            )}

            {props.error && !props.loading && (
                <div style={{ textAlign: "center", padding: "40px", fontFamily: "monospace", color: "#f44336" }}>
                    {t("laptop.desktop_screen.cases_app.error_loading")}
                </div>
            )}

            {!props.loading && !props.error && props.data && props.data.cases.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", fontFamily: "monospace" }}>
                    {t("laptop.desktop_screen.cases_app.no_cases")}
                </div>
            )}

            {!props.loading && !props.error && props.data && props.data.cases.map((caseItem) => (
                <div
                    key={caseItem.id}
                    onClick={() => props.onCaseSelect(caseItem)}
                    style={{
                        padding: "15px",
                        marginBottom: "10px",
                        border: "2px solid #000",
                        cursor: "pointer",
                        background: "#f0f0f0",
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#e0e0e0"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#f0f0f0"}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div>
                            <strong style={{ fontFamily: "monospace", fontSize: "16px" }}>
                                {caseItem.case_number}
                            </strong>
                            <span
                                style={{
                                    marginLeft: "10px",
                                    padding: "2px 8px",
                                    background: getStatusColor(caseItem.status),
                                    color: "white",
                                    fontFamily: "monospace",
                                    fontSize: "12px"
                                }}
                            >
                                {caseItem.status.toUpperCase()}
                            </span>
                        </div>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#666" }}>
                            {formatDate(caseItem.updated_at)}
                        </span>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>
                        {caseItem.title}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#666" }}>
                        {t("laptop.desktop_screen.cases_app.assigned_to")}: {caseItem.assigned_to || t("laptop.desktop_screen.cases_app.unassigned")}
                    </div>
                </div>
            ))}
        </div>

        {/* Pagination */}
        {!props.loading && !props.error && props.data && props.maxPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <button
                    disabled={props.page === 1}
                    onClick={() => props.onPageChange(props.page - 1)}
                    style={{
                        padding: "8px 16px",
                        border: "2px solid #000",
                        background: props.page === 1 ? "#ccc" : "white",
                        cursor: props.page === 1 ? "not-allowed" : "pointer",
                        fontFamily: "monospace"
                    }}
                >
                    {t("laptop.desktop_screen.cases_app.previous")}
                </button>
                <span style={{ padding: "8px 16px", fontFamily: "monospace", display: "flex", alignItems: "center" }}>
                    {props.page} / {props.maxPages}
                </span>
                <button
                    disabled={props.page === props.maxPages}
                    onClick={() => props.onPageChange(props.page + 1)}
                    style={{
                        padding: "8px 16px",
                        border: "2px solid #000",
                        background: props.page === props.maxPages ? "#ccc" : "white",
                        cursor: props.page === props.maxPages ? "not-allowed" : "pointer",
                        fontFamily: "monospace"
                    }}
                >
                    {t("laptop.desktop_screen.cases_app.next")}
                </button>
            </div>
        )}

        {/* Create Case Modal */}
        {showCreateModal && (
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000
            }}>
                <div style={{
                    background: "#c0c0c0",
                    border: "3px solid #000",
                    padding: "20px",
                    minWidth: "500px",
                    boxShadow: "5px 5px 0px #000"
                }}>
                    <h3 style={{ margin: "0 0 20px 0", fontFamily: "monospace" }}>
                        {t("laptop.desktop_screen.cases_app.create_new_case")}
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                            <label style={{ fontFamily: "monospace", fontSize: "14px", display: "block", marginBottom: "5px" }}>
                                {t("laptop.desktop_screen.cases_app.case_number")} *
                            </label>
                            <input
                                type="text"
                                value={newCaseNumber}
                                onChange={(e) => setNewCaseNumber(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "2px solid #000",
                                    fontFamily: "monospace",
                                    fontSize: "14px"
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontFamily: "monospace", fontSize: "14px", display: "block", marginBottom: "5px" }}>
                                {t("laptop.desktop_screen.cases_app.title")} *
                            </label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "2px solid #000",
                                    fontFamily: "monospace",
                                    fontSize: "14px"
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontFamily: "monospace", fontSize: "14px", display: "block", marginBottom: "5px" }}>
                                {t("laptop.desktop_screen.cases_app.description")}
                            </label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows={4}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "2px solid #000",
                                    fontFamily: "monospace",
                                    fontSize: "14px",
                                    resize: "vertical"
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontFamily: "monospace", fontSize: "14px", display: "block", marginBottom: "5px" }}>
                                {t("laptop.desktop_screen.cases_app.assigned_to")}
                            </label>
                            <input
                                type="text"
                                value={newAssignedTo}
                                onChange={(e) => setNewAssignedTo(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "2px solid #000",
                                    fontFamily: "monospace",
                                    fontSize: "14px"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{
                                    padding: "10px 20px",
                                    background: "white",
                                    border: "2px solid #000",
                                    cursor: "pointer",
                                    fontFamily: "monospace",
                                    fontSize: "14px"
                                }}
                            >
                                {t("laptop.desktop_screen.cases_app.cancel")}
                            </button>
                            <button
                                onClick={handleCreateCase}
                                disabled={!newCaseNumber || !newTitle}
                                style={{
                                    padding: "10px 20px",
                                    background: (!newCaseNumber || !newTitle) ? "#ccc" : "#008080",
                                    color: "white",
                                    border: "2px solid #000",
                                    cursor: (!newCaseNumber || !newTitle) ? "not-allowed" : "pointer",
                                    fontFamily: "monospace",
                                    fontSize: "14px"
                                }}
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
