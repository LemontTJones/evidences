local database = {}

-- Create cases table
MySQL.query.await([[CREATE TABLE IF NOT EXISTS cases (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('open', 'active', 'closed', 'archived') DEFAULT 'open',
    created_by VARCHAR(255) NOT NULL,
    assigned_to TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
)]])

-- Create case_evidence table for linking evidence to cases
MySQL.query.await([[CREATE TABLE IF NOT EXISTS case_evidence (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    evidence_type ENUM('fingerprint', 'dna', 'magazine', 'other') NOT NULL,
    evidence_identifier VARCHAR(255) NOT NULL,
    notes TEXT,
    added_by VARCHAR(255) NOT NULL,
    added_at BIGINT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
)]])

-- Create case_notes table for case timeline/notes
MySQL.query.await([[CREATE TABLE IF NOT EXISTS case_notes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    note TEXT NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
)]])

-- Create a new case
function database.createCase(caseNumber, title, description, createdBy, assignedTo)
    local currentMillis = os.time() * 1000

    local result = MySQL.insert.await([[
        INSERT INTO cases (case_number, title, description, status, created_by, assigned_to, created_at, updated_at)
        VALUES (?, ?, ?, 'open', ?, ?, ?, ?)
    ]], { caseNumber, title, description, createdBy, assignedTo, currentMillis, currentMillis })

    return result
end

-- Update a case
function database.updateCase(caseId, title, description, status, assignedTo)
    local currentMillis = os.time() * 1000

    MySQL.update.await([[
        UPDATE cases
        SET title = ?, description = ?, status = ?, assigned_to = ?, updated_at = ?
        WHERE id = ?
    ]], { title, description, status, assignedTo, currentMillis, caseId })

    return true
end

-- Get all cases with pagination and search
function database.getCases(search, status, page, limit)
    limit = limit or 10
    page = page or 1
    local offset = (page - 1) * limit

    local whereConditions = {}
    local params = {}

    if search and search ~= "" then
        local pattern = "%" .. search:gsub("\\", "\\\\"):gsub("%%", "\\%%"):gsub("_", "\\_") .. "%"
        whereConditions[#whereConditions + 1] = "(case_number LIKE ? OR title LIKE ? OR description LIKE ?)"
        params[#params + 1] = pattern
        params[#params + 1] = pattern
        params[#params + 1] = pattern
    end

    if status and status ~= "" and status ~= "all" then
        whereConditions[#whereConditions + 1] = "status = ?"
        params[#params + 1] = status
    end

    local whereClause = ""
    if #whereConditions > 0 then
        whereClause = "WHERE " .. table.concat(whereConditions, " AND ")
    end

    -- Get total count
    local countQuery = "SELECT COUNT(*) as total FROM cases " .. whereClause
    local totalCount = MySQL.scalar.await(countQuery, params) or 0

    -- Get cases
    params[#params + 1] = limit
    params[#params + 1] = offset
    local casesQuery = "SELECT * FROM cases " .. whereClause .. " ORDER BY updated_at DESC LIMIT ? OFFSET ?"
    local cases = MySQL.query.await(casesQuery, params) or {}

    return {
        cases = cases,
        total = totalCount,
        maxPages = math.max(1, math.ceil(totalCount / limit)),
        currentPage = page
    }
end

-- Get a specific case by ID
function database.getCaseById(caseId)
    return MySQL.single.await("SELECT * FROM cases WHERE id = ?", { caseId })
end

-- Delete a case
function database.deleteCase(caseId)
    MySQL.update.await("DELETE FROM cases WHERE id = ?", { caseId })
    return true
end

-- Add evidence to a case
function database.addEvidenceToCase(caseId, evidenceType, evidenceIdentifier, notes, addedBy)
    local currentMillis = os.time() * 1000

    local result = MySQL.insert.await([[
        INSERT INTO case_evidence (case_id, evidence_type, evidence_identifier, notes, added_by, added_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ]], { caseId, evidenceType, evidenceIdentifier, notes, addedBy, currentMillis })

    -- Update case updated_at timestamp
    MySQL.update.await("UPDATE cases SET updated_at = ? WHERE id = ?", { currentMillis, caseId })

    return result
end

-- Remove evidence from a case
function database.removeEvidenceFromCase(evidenceId)
    local evidence = MySQL.single.await("SELECT case_id FROM case_evidence WHERE id = ?", { evidenceId })
    if not evidence then return false end

    MySQL.update.await("DELETE FROM case_evidence WHERE id = ?", { evidenceId })

    -- Update case updated_at timestamp
    local currentMillis = os.time() * 1000
    MySQL.update.await("UPDATE cases SET updated_at = ? WHERE id = ?", { currentMillis, evidence.case_id })

    return true
end

-- Get all evidence for a case
function database.getCaseEvidence(caseId)
    return MySQL.query.await([[
        SELECT * FROM case_evidence
        WHERE case_id = ?
        ORDER BY added_at DESC
    ]], { caseId }) or {}
end

-- Add a note to a case
function database.addCaseNote(caseId, note, createdBy)
    local currentMillis = os.time() * 1000

    local result = MySQL.insert.await([[
        INSERT INTO case_notes (case_id, note, created_by, created_at)
        VALUES (?, ?, ?, ?)
    ]], { caseId, note, createdBy, currentMillis })

    -- Update case updated_at timestamp
    MySQL.update.await("UPDATE cases SET updated_at = ? WHERE id = ?", { currentMillis, caseId })

    return result
end

-- Get all notes for a case
function database.getCaseNotes(caseId)
    return MySQL.query.await([[
        SELECT * FROM case_notes
        WHERE case_id = ?
        ORDER BY created_at DESC
    ]], { caseId }) or {}
end

-- Get cases by evidence identifier (to check which cases an evidence is linked to)
function database.getCasesByEvidence(evidenceType, evidenceIdentifier)
    return MySQL.query.await([[
        SELECT c.* FROM cases c
        INNER JOIN case_evidence ce ON c.id = ce.case_id
        WHERE ce.evidence_type = ? AND ce.evidence_identifier = ?
        ORDER BY c.updated_at DESC
    ]], { evidenceType, evidenceIdentifier }) or {}
end

return database
