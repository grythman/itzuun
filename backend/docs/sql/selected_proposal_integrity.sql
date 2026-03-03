-- Enforce projects_project.selected_proposal_id belongs to the same project.
-- PostgreSQL-only trigger for DB-level integrity.

CREATE OR REPLACE FUNCTION fn_enforce_selected_proposal_same_project()
RETURNS trigger AS $$
DECLARE
    proposal_project_id bigint;
BEGIN
    IF NEW.selected_proposal_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT project_id INTO proposal_project_id
    FROM projects_proposal
    WHERE id = NEW.selected_proposal_id;

    IF proposal_project_id IS NULL THEN
        RAISE EXCEPTION 'selected_proposal_id % does not exist in projects_proposal', NEW.selected_proposal_id;
    END IF;

    IF proposal_project_id <> NEW.id THEN
        RAISE EXCEPTION 'Integrity violation: proposal % belongs to project %, but selected on project %',
            NEW.selected_proposal_id,
            proposal_project_id,
            NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_selected_proposal_same_project ON projects_project;

CREATE TRIGGER trg_selected_proposal_same_project
BEFORE INSERT OR UPDATE OF selected_proposal_id ON projects_project
FOR EACH ROW
EXECUTE FUNCTION fn_enforce_selected_proposal_same_project();
