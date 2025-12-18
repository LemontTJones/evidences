import { useCallback, useEffect, useState } from "react";
import type { Case, CaseEvidence, CaseNote, CaseStatus } from "./CasesApp";
import { useTranslation } from "../../../TranslationContext";
import Spinner from "../../../atoms/Spinner";
import EvidenceChooser, { type ChosenEvidence, type EvidenceDetails } from "../../../atoms/EvidenceChooser";
import styles from "../../../../css/CaseDetail.module.css";

interface CaseDetailProps {
    caseItem: Case;
    onBack: () => void;
}

export default function CaseDetail(props: CaseDetailProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [evidence, setEvidence] = useState<CaseEvidence[]>([]);
    const [notes, setNotes] = useState<CaseNote[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [editedTitle, setEditedTitle] = useState(props.caseItem.title);
    const [editedDescription, setEditedDescription] = useState(props.caseItem.description);
    const [editedStatus, setEditedStatus] = useState<CaseStatus>(props.caseItem.status);
    const [editedAssignedTo, setEditedAssignedTo] = useState(props.caseItem.assigned_to);
    const [newNote, setNewNote] = useState("");
    const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
    const [newEvidenceType, setNewEvidenceType] = useState<"fingerprint" | "dna" | "magazine" | "other">("fingerprint");
    const [newEvidenceId, setNewEvidenceId] = useState("");
    const [newEvidenceNotes, setNewEvidenceNotes] = useState("");
    const [evidenceSourceMode, setEvidenceSourceMode] = useState<"inventory" | "database" | "manual">("inventory");
    const [chosenEvidence, setChosenEvidence] = useState<ChosenEvidence | null>(null);
    const [databaseSearchResults, setDatabaseSearchResults] = useState<any[]>([]);
    const [databaseSearchText, setDatabaseSearchText] = useState("");

    // Load evidence and notes
    const loadCaseData = useCallback(() => {
        setLoading(true);

        Promise.all([
            fetch(`https://${location.host}/triggerServerCallback`, {
                method: "post",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({
                    name: "evidences:getCaseEvidence",
                    arguments: { caseId: props.caseItem.id }
                })
            }).then(r => r.json()),

            fetch(`https://${location.host}/triggerServerCallback`, {
                method: "post",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({
                    name: "evidences:getCaseNotes",
                    arguments: { caseId: props.caseItem.id }
                })
            }).then(r => r.json())
        ]).then(([evidenceData, notesData]) => {
            setEvidence(evidenceData);
            setNotes(notesData);
        }).finally(() => {
            setLoading(false);
        });
    }, [props.caseItem.id]);

    useEffect(() => {
        loadCaseData();
    }, [loadCaseData]);

    const handleSaveCase = useCallback(() => {
        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify({
                name: "evidences:updateCase",
                arguments: {
                    caseId: props.caseItem.id,
                    title: editedTitle,
                    description: editedDescription,
                    status: editedStatus,
                    assignedTo: editedAssignedTo
                }
            })
        }).then(() => {
            setEditMode(false);
        });
    }, [props.caseItem.id, editedTitle, editedDescription, editedStatus, editedAssignedTo]);

    const handleAddNote = useCallback(() => {
        if (!newNote.trim()) return;

        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify({
                name: "evidences:addCaseNote",
                arguments: {
                    caseId: props.caseItem.id,
                    note: newNote
                }
            })
        }).then(() => {
            setNewNote("");
            loadCaseData();
        });
    }, [props.caseItem.id, newNote, loadCaseData]);

    const handleAddEvidence = useCallback(() => {
        if (!newEvidenceId.trim()) return;

        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify({
                name: "evidences:addEvidenceToCase",
                arguments: {
                    caseId: props.caseItem.id,
                    evidenceType: newEvidenceType,
                    evidenceIdentifier: newEvidenceId,
                    notes: newEvidenceNotes
                }
            })
        }).then(() => {
            setShowAddEvidenceModal(false);
            setNewEvidenceId("");
            setNewEvidenceNotes("");
            loadCaseData();
        });
    }, [props.caseItem.id, newEvidenceType, newEvidenceId, newEvidenceNotes, loadCaseData]);

    const handleRemoveEvidence = useCallback((evidenceId: number) => {
        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify({
                name: "evidences:removeEvidenceFromCase",
                arguments: { evidenceId }
            })
        }).then(() => {
            loadCaseData();
        });
    }, [loadCaseData]);

    const handleEvidenceSelection = useCallback((label: string, imagePath: string, container: number | string, slot: number, identifier: string, _details: EvidenceDetails) => {
        setChosenEvidence({
            evidence: {
                label: label,
                imagePath: imagePath,
                container: container,
                slot: slot,
                identifier: identifier
            },
            timestamp: new Date().getTime()
        });
        setNewEvidenceId(identifier);
    }, []);

    const handleDatabaseSearch = useCallback(() => {
        if (!databaseSearchText.trim()) {
            setDatabaseSearchResults([]);
            return;
        }

        const types: ("fingerprint" | "dna")[] = [];
        if (newEvidenceType === "fingerprint") types.push("fingerprint");
        if (newEvidenceType === "dna") types.push("dna");

        if (types.length === 0) {
            setDatabaseSearchResults([]);
            return;
        }

        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify({
                name: "evidences:getStoredBiometricDataEntries",
                arguments: {
                    types: types,
                    search: databaseSearchText,
                    page: 1
                }
            })
        }).then(r => r.json()).then(response => {
            setDatabaseSearchResults(response.entries || []);
        });
    }, [databaseSearchText, newEvidenceType]);

    const handleSelectDatabaseEntry = useCallback((entry: any) => {
        setNewEvidenceId(entry.identifier);
    }, []);

    const handleOpenAddEvidenceModal = useCallback(() => {
        setShowAddEvidenceModal(true);
        setNewEvidenceType("fingerprint");
        setNewEvidenceId("");
        setNewEvidenceNotes("");
        setEvidenceSourceMode("inventory");
        setChosenEvidence(null);
        setDatabaseSearchResults([]);
        setDatabaseSearchText("");
    }, []);

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

    return <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
            <button
                onClick={props.onBack}
                className={`${styles.back__button} hoverable`}
            >
                ← {t("laptop.desktop_screen.cases_app.back")}
            </button>

            {!editMode ? (
                <button
                    onClick={() => setEditMode(true)}
                    className={`${styles.edit__button} hoverable`}
                >
                    {t("laptop.desktop_screen.cases_app.edit")}
                </button>
            ) : (
                <div style={{ display: "flex", gap: "15px" }}>
                    <button
                        onClick={() => setEditMode(false)}
                        className={`${styles.cancel__button} hoverable`}
                    >
                        {t("laptop.desktop_screen.cases_app.cancel")}
                    </button>
                    <button
                        onClick={handleSaveCase}
                        className={`${styles.save__button} hoverable`}
                    >
                        {t("laptop.desktop_screen.cases_app.save")}
                    </button>
                </div>
            )}
        </div>

        {/* Case Info */}
        <div className={styles.info__panel}>
            <div className={styles.case__number}>
                {props.caseItem.case_number}
                {!editMode ? (
                    <span
                        className={styles.status__badge}
                        style={{ background: getStatusColor(props.caseItem.status) }}
                    >
                        {props.caseItem.status.toUpperCase()}
                    </span>
                ) : (
                    <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value as CaseStatus)}
                        className={styles.status__select}
                    >
                        <option value="open">{t("laptop.desktop_screen.cases_app.status_open")}</option>
                        <option value="active">{t("laptop.desktop_screen.cases_app.status_active")}</option>
                        <option value="closed">{t("laptop.desktop_screen.cases_app.status_closed")}</option>
                        <option value="archived">{t("laptop.desktop_screen.cases_app.status_archived")}</option>
                    </select>
                )}
            </div>

            <div className={styles.field__group}>
                <label className={styles.field__label}>
                    {t("laptop.desktop_screen.cases_app.title")}:
                </label>
                {!editMode ? (
                    <div className={styles.field__value}>
                        {props.caseItem.title}
                    </div>
                ) : (
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className={`${styles.field__input} textable`}
                    />
                )}
            </div>

            <div className={styles.field__group}>
                <label className={styles.field__label}>
                    {t("laptop.desktop_screen.cases_app.description")}:
                </label>
                {!editMode ? (
                    <div className={styles.field__value}>
                        {props.caseItem.description || t("laptop.desktop_screen.cases_app.no_description")}
                    </div>
                ) : (
                    <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={4}
                        className={`${styles.field__textarea} textable`}
                    />
                )}
            </div>

            <div className={styles.field__group}>
                <label className={styles.field__label}>
                    {t("laptop.desktop_screen.cases_app.assigned_to")}:
                </label>
                {!editMode ? (
                    <div className={styles.field__value}>
                        {props.caseItem.assigned_to || t("laptop.desktop_screen.cases_app.unassigned")}
                    </div>
                ) : (
                    <input
                        type="text"
                        value={editedAssignedTo}
                        onChange={(e) => setEditedAssignedTo(e.target.value)}
                        className={`${styles.field__input} textable`}
                    />
                )}
            </div>

            <div className={styles.metadata}>
                <div>{t("laptop.desktop_screen.cases_app.created_by")}: {props.caseItem.created_by}</div>
                <div>{t("laptop.desktop_screen.cases_app.created_at")}: {formatDate(props.caseItem.created_at)}</div>
                <div>{t("laptop.desktop_screen.cases_app.updated_at")}: {formatDate(props.caseItem.updated_at)}</div>
            </div>
        </div>

        {loading ? (
            <div className={styles.loading__container}>
                <Spinner black />
            </div>
        ) : (
            <>
                {/* Evidence Section */}
                <div className={styles.section__panel}>
                    <div className={styles.section__header}>
                        <h3 className={styles.section__title}>
                            {t("laptop.desktop_screen.cases_app.evidence")} ({evidence.length})
                        </h3>
                        <button
                            onClick={handleOpenAddEvidenceModal}
                            className={`${styles.add__button} hoverable`}
                        >
                            + {t("laptop.desktop_screen.cases_app.add_evidence")}
                        </button>
                    </div>

                    {evidence.length === 0 ? (
                        <div className={styles.empty__message}>
                            {t("laptop.desktop_screen.cases_app.no_evidence")}
                        </div>
                    ) : (
                        <div className={styles.evidence__list}>
                            {evidence.map((ev) => (
                                <div key={ev.id} className={styles.evidence__item}>
                                    <div className={styles.evidence__content}>
                                        <div className={styles.evidence__type}>
                                            {ev.evidence_type.toUpperCase()}: {ev.evidence_identifier}
                                        </div>
                                        {ev.notes && (
                                            <div className={styles.evidence__notes}>
                                                {ev.notes}
                                            </div>
                                        )}
                                        <div className={styles.evidence__meta}>
                                            Added by {ev.added_by} on {formatDate(ev.added_at)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveEvidence(ev.id)}
                                        className={`${styles.remove__button} hoverable`}
                                    >
                                        {t("laptop.desktop_screen.cases_app.remove")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div className={styles.section__panel}>
                    <h3 className={styles.section__title}>
                        {t("laptop.desktop_screen.cases_app.notes")} ({notes.length})
                    </h3>

                    <div className={styles.note__form}>
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder={t("laptop.desktop_screen.cases_app.add_note_placeholder")}
                            rows={3}
                            className={`${styles.note__textarea} textable`}
                        />
                        <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim()}
                            className={`${styles.note__submit} hoverable`}
                        >
                            {t("laptop.desktop_screen.cases_app.add_note")}
                        </button>
                    </div>

                    {notes.length === 0 ? (
                        <div className={styles.empty__message}>
                            {t("laptop.desktop_screen.cases_app.no_notes")}
                        </div>
                    ) : (
                        <div className={styles.notes__list}>
                            {notes.map((note) => (
                                <div key={note.id} className={styles.note__item}>
                                    <div className={styles.note__content}>
                                        <div className={styles.note__text}>
                                            {note.note}
                                        </div>
                                        <div className={styles.note__meta}>
                                            {note.created_by} - {formatDate(note.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
        )}

        {/* Add Evidence Modal */}
        {showAddEvidenceModal && (
            <div className={styles.modal__overlay}>
                <div className={styles.modal__content}>
                    <h3 className={styles.modal__title}>
                        {t("laptop.desktop_screen.cases_app.add_evidence")}
                    </h3>

                    <div className={styles.modal__form}>
                        {/* Evidence Type Selection */}
                        <div>
                            <label className={styles.form__label}>
                                {t("laptop.desktop_screen.cases_app.evidence_type")}
                            </label>
                            <select
                                value={newEvidenceType}
                                onChange={(e) => {
                                    setNewEvidenceType(e.target.value as any);
                                    setNewEvidenceId("");
                                    setChosenEvidence(null);
                                    setDatabaseSearchResults([]);
                                    setDatabaseSearchText("");
                                }}
                                className={styles.form__select}
                            >
                                <option value="fingerprint">{t("laptop.desktop_screen.cases_app.evidence_fingerprint")}</option>
                                <option value="dna">{t("laptop.desktop_screen.cases_app.evidence_dna")}</option>
                                <option value="magazine">{t("laptop.desktop_screen.cases_app.evidence_magazine")}</option>
                                <option value="other">{t("laptop.desktop_screen.cases_app.evidence_other")}</option>
                            </select>
                        </div>

                        {/* Source Mode Tabs - Only for fingerprint/DNA */}
                        {(newEvidenceType === "fingerprint" || newEvidenceType === "dna") && (
                            <div className={styles.tabs}>
                                <button
                                    onClick={() => {
                                        setEvidenceSourceMode("inventory");
                                        setNewEvidenceId("");
                                        setChosenEvidence(null);
                                    }}
                                    className={evidenceSourceMode === "inventory" ? styles.tab__active : styles.tab__inactive}
                                >
                                    From Inventory
                                </button>
                                <button
                                    onClick={() => {
                                        setEvidenceSourceMode("database");
                                        setNewEvidenceId("");
                                        setDatabaseSearchResults([]);
                                    }}
                                    className={evidenceSourceMode === "database" ? styles.tab__active : styles.tab__inactive}
                                >
                                    Search Database
                                </button>
                                <button
                                    onClick={() => {
                                        setEvidenceSourceMode("manual");
                                        setNewEvidenceId("");
                                        setChosenEvidence(null);
                                    }}
                                    className={evidenceSourceMode === "manual" ? styles.tab__active : styles.tab__inactive}
                                >
                                    Manual Entry
                                </button>
                            </div>
                        )}

                        {/* Content based on source mode */}
                        <div className={styles.tab__content}>
                            {/* Inventory Mode */}
                            {evidenceSourceMode === "inventory" && (newEvidenceType === "fingerprint" || newEvidenceType === "dna") && (
                                <div className={styles.evidence__chooser__container}>
                                    <p className={styles.hint__text}>
                                        Select evidence from your inventory:
                                    </p>
                                    <EvidenceChooser
                                        type={newEvidenceType === "fingerprint" ? "FINGERPRINT" : "DNA"}
                                        chosenEvidence={chosenEvidence}
                                        translations={{
                                            noItemsWithEvidences: `No ${newEvidenceType} evidence in inventory`
                                        }}
                                        onEvidenceSelection={handleEvidenceSelection}
                                    />
                                    {chosenEvidence?.evidence && (
                                        <div className={styles.evidence__selected}>
                                            <p className={styles.evidence__selected__text}>
                                                Selected: {chosenEvidence.evidence.identifier}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Database Search Mode */}
                            {evidenceSourceMode === "database" && (newEvidenceType === "fingerprint" || newEvidenceType === "dna") && (
                                <div>
                                    <p className={styles.hint__text}>
                                        Search stored biometric database:
                                    </p>
                                    <div className={styles.database__search}>
                                        <input
                                            type="text"
                                            placeholder="Search by identifier, name, or birthdate..."
                                            value={databaseSearchText}
                                            onChange={(e) => setDatabaseSearchText(e.target.value)}
                                            className={`${styles.database__search__input} textable`}
                                        />
                                        <button
                                            onClick={handleDatabaseSearch}
                                            className={`${styles.database__search__button} hoverable`}
                                        >
                                            Search
                                        </button>
                                    </div>
                                    <div className={styles.database__results}>
                                        {databaseSearchResults.length === 0 ? (
                                            <p className={styles.database__empty}>
                                                {databaseSearchText ? "No results found" : "Enter search terms and click Search"}
                                            </p>
                                        ) : (
                                            databaseSearchResults.map((entry, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleSelectDatabaseEntry(entry)}
                                                    className={newEvidenceId === entry.identifier ? styles.database__entry__selected : styles.database__entry__unselected}
                                                >
                                                    <strong>{entry.identifier}</strong><br />
                                                    {entry.firstname} {entry.lastname} - {entry.birthdate}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Manual Entry Mode */}
                            {(evidenceSourceMode === "manual" || newEvidenceType === "magazine" || newEvidenceType === "other") && (
                                <div>
                                    <label className={styles.manual__entry__label}>
                                        {t("laptop.desktop_screen.cases_app.evidence_identifier")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={newEvidenceId}
                                        onChange={(e) => setNewEvidenceId(e.target.value)}
                                        placeholder="Enter evidence identifier manually..."
                                        className={`${styles.manual__entry__input} textable`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Notes Section */}
                        <div>
                            <label className={styles.form__label}>
                                {t("laptop.desktop_screen.cases_app.notes")}
                            </label>
                            <textarea
                                value={newEvidenceNotes}
                                onChange={(e) => setNewEvidenceNotes(e.target.value)}
                                rows={3}
                                placeholder="Add any additional notes about this evidence..."
                                className={`${styles.form__textarea} textable`}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className={styles.modal__actions}>
                            <button
                                onClick={() => setShowAddEvidenceModal(false)}
                                className={`${styles.modal__cancel} hoverable`}
                            >
                                {t("laptop.desktop_screen.cases_app.cancel")}
                            </button>
                            <button
                                onClick={handleAddEvidence}
                                disabled={!newEvidenceId.trim()}
                                className={`${styles.modal__submit} hoverable`}
                            >
                                {t("laptop.desktop_screen.cases_app.add")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>;
}
