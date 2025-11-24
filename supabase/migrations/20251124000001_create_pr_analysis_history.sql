-- Create pr_analysis_history table to track all PR analyses
CREATE TABLE IF NOT EXISTS pr_analysis_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- PR Information
    repository_owner TEXT NOT NULL,
    repository_name TEXT NOT NULL,
    pr_number INTEGER NOT NULL,
    pr_title TEXT,
    pr_author TEXT,
    pr_state TEXT,
    pr_url TEXT,
    
    -- Analysis Scores
    code_quality_score INTEGER, -- 0-100
    ml_impact_score INTEGER, -- 0-100
    risk_level TEXT, -- 'low', 'medium', 'high'
    
    -- Detailed Results (JSONB for flexibility)
    code_analysis_result JSONB,
    ml_analysis_result JSONB,
    
    -- Metadata
    analysis_duration_ms INTEGER,
    files_changed INTEGER,
    additions INTEGER,
    deletions INTEGER,
    
    -- Timestamps
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for common queries
    CONSTRAINT unique_pr_analysis UNIQUE (user_id, repository_owner, repository_name, pr_number, analyzed_at)
);

-- Create indexes for faster queries
CREATE INDEX idx_pr_history_user_id ON pr_analysis_history(user_id);
CREATE INDEX idx_pr_history_repository ON pr_analysis_history(repository_owner, repository_name);
CREATE INDEX idx_pr_history_analyzed_at ON pr_analysis_history(analyzed_at DESC);
CREATE INDEX idx_pr_history_scores ON pr_analysis_history(code_quality_score, ml_impact_score);

-- Enable Row Level Security
ALTER TABLE pr_analysis_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own analysis history"
    ON pr_analysis_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis history"
    ON pr_analysis_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis history"
    ON pr_analysis_history
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis history"
    ON pr_analysis_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to get analysis trends
CREATE OR REPLACE FUNCTION get_analysis_trends(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    avg_code_quality NUMERIC,
    avg_ml_impact NUMERIC,
    total_analyses BIGINT,
    high_risk_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(analyzed_at) as date,
        ROUND(AVG(code_quality_score), 2) as avg_code_quality,
        ROUND(AVG(ml_impact_score), 2) as avg_ml_impact,
        COUNT(*) as total_analyses,
        COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_count
    FROM pr_analysis_history
    WHERE user_id = p_user_id
        AND analyzed_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(analyzed_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_analysis_trends(UUID, INTEGER) TO authenticated;
