import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "../../../../hooks/useDebounce";
import CasesList from "./CasesList";
import CaseDetail from "./CaseDetail";

export type CaseStatus = "open" | "active" | "closed" | "archived";

export interface Case {
    id: number;
    case_number: string;
    title: string;
    description: string;
    status: CaseStatus;
    created_by: string;
    assigned_to: string;
    created_at: number;
    updated_at: number;
}

export interface CaseEvidence {
    id: number;
    case_id: number;
    evidence_type: "fingerprint" | "dna" | "magazine" | "other";
    evidence_identifier: string;
    notes: string;
    added_by: string;
    added_at: number;
}

export interface CaseNote {
    id: number;
    case_id: number;
    note: string;
    created_by: string;
    created_at: number;
}

export interface CasesResponse {
    cases: Case[];
    total: number;
    maxPages: number;
    currentPage: number;
}

export default function CasesApp() {
    const [searchText, setSearchText] = useState<string>("");
    const searchTextDebounced = useDebounce<string>(searchText, 750);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState<number>(1);
    const [maxPages, setMaxPages] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [data, setData] = useState<CasesResponse | null>(null);
    const [reloadTrigger, setReloadTrigger] = useState<number>(0);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [view, setView] = useState<"list" | "detail">("list");

    // Fetch cases
    useEffect(() => {
        setLoading(true);
        setError(false);

        fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                name: "evidences:getCases",
                arguments: {
                    search: searchText,
                    status: statusFilter,
                    page: page,
                    limit: 10
                }
            })
        }).then(response => response.json()).then(response => {
            setData(response);
            setMaxPages(response.maxPages);
        }).catch(() => {
            setError(true);
        }).finally(() => {
            setLoading(false);
        });
    }, [searchTextDebounced, statusFilter, page, reloadTrigger]);

    const handleCaseSelect = useCallback((caseItem: Case) => {
        setSelectedCase(caseItem);
        setView("detail");
    }, []);

    const handleBackToList = useCallback(() => {
        setView("list");
        setSelectedCase(null);
        setReloadTrigger(prev => prev + 1);
    }, []);

    const handleCreateCase = useCallback((caseNumber: string, title: string, description: string, assignedTo: string) => {
        return fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                name: "evidences:createCase",
                arguments: {
                    caseNumber,
                    title,
                    description,
                    assignedTo
                }
            })
        }).then(() => {
            setReloadTrigger(prev => prev + 1);
        });
    }, []);

    const handleDeleteCase = useCallback((caseId: number) => {
        return fetch(`https://${location.host}/triggerServerCallback`, {
            method: "post",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                name: "evidences:deleteCase",
                arguments: { caseId }
            })
        }).then(() => {
            setReloadTrigger(prev => prev + 1);
        });
    }, []);

    return <div style={{ width: "100%", height: "100%", background: "#c0c0c0ff" }}>
        {view === "list" && (
            <CasesList
                data={data}
                loading={loading}
                error={error}
                searchText={searchText}
                statusFilter={statusFilter}
                page={page}
                maxPages={maxPages}
                onSearchChange={setSearchText}
                onStatusFilterChange={setStatusFilter}
                onPageChange={setPage}
                onCaseSelect={handleCaseSelect}
                onCreateCase={handleCreateCase}
                onDeleteCase={handleDeleteCase}
            />
        )}
        {view === "detail" && selectedCase && (
            <CaseDetail
                caseItem={selectedCase}
                onBack={handleBackToList}
            />
        )}
    </div>;
}
