const supabase = require('./supabase');

async function truncateTables() {
  try {
    await supabase.from('aegis').delete().not('id', 'is', null);

    await supabase.from('audit_requests').delete().not('id', 'is', null);

    await supabase.from('token_audits').delete().not('id', 'is', null);

    console.log('All tables truncated successfully');
  } catch (error) {
    console.error('Error truncating tables:', error);
  }
}

async function createTablesAndFunctions() {
  // SQL statements to create tables and functions
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS aegis (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id),
        whitelisted BOOLEAN NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS audit_requests (
        request_id SERIAL PRIMARY KEY,
        contract VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'partial', 'completed')),
        status_log TEXT,
        created_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS token_audits (
        audit_id SERIAL PRIMARY KEY,
        contract VARCHAR(255) NOT NULL,
        score_health NUMERIC(5, 2),
        score_security NUMERIC(5, 2),
        score_strength NUMERIC(5, 2),
        score_total NUMERIC(5, 2),
        findings_low INTEGER DEFAULT 0,
        findings_medium INTEGER DEFAULT 0,
        findings_high INTEGER DEFAULT 0,
        findings_critical INTEGER DEFAULT 0,
        findings_total INTEGER DEFAULT 0,
        audit_loc INTEGER,
        created_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createFunctionsSql = `
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_on = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_audit_requests_modtime
    BEFORE UPDATE ON audit_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

    CREATE TRIGGER update_token_audits_modtime
    BEFORE UPDATE ON token_audits
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  `;

  try {
    // Execute the SQL for creating tables
    let { error: createTablesError } = await supabase.raw(createTablesSql);
    if (createTablesError) throw createTablesError;

    // Execute the SQL for creating functions and triggers
    let { error: createFunctionsError } = await supabase.raw(
      createFunctionsSql
    );
    if (createFunctionsError) throw createFunctionsError;

    console.log('Tables and functions created successfully');
  } catch (error) {
    console.error('Error creating tables and functions:', error);
  }
}

// Call the function to truncate tables
truncateTables();

// Call the function to create tables and functions
// createTablesAndFunctions();
