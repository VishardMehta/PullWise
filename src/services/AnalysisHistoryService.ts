import { supabase } from '@/integrations/supabase/client';
import type { MLAnalysisResult } from './MLAnalysisService';
import type { CodeAnalysisResult } from './CodeAnalysisService';

export interface SaveHistoryParams {
  repositoryOwner: string;
  repositoryName: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  prState: string;
  prUrl: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  codeAnalysisResult: CodeAnalysisResult | null;
  mlAnalysisResult: MLAnalysisResult | null;
  analysisDurationMs?: number;
}

export class AnalysisHistoryService {
  private static instance: AnalysisHistoryService;

  private constructor() {}

  public static getInstance(): AnalysisHistoryService {
    if (!AnalysisHistoryService.instance) {
      AnalysisHistoryService.instance = new AnalysisHistoryService();
    }
    return AnalysisHistoryService.instance;
  }

  /**
   * Save PR analysis to history for trends tracking
   */
  public async saveAnalysis(params: SaveHistoryParams): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user, skipping history save');
        return;
      }

      // Calculate scores
      let codeQualityScore: number | null = null;
      if (params.codeAnalysisResult) {
        // Calculate quality score from metrics (0-100)
        const metrics = params.codeAnalysisResult.metrics;
        const errorPenalty = metrics.issues.errors * 10;
        const warningPenalty = metrics.issues.warnings * 5;
        const suggestionPenalty = metrics.issues.suggestions * 2;
        const complexityPenalty = Math.max(0, metrics.complexity - 10) * 2;
        
        codeQualityScore = Math.max(
          0,
          Math.min(100, 100 - errorPenalty - warningPenalty - suggestionPenalty - complexityPenalty)
        );
      }
      
      const mlImpactScore = params.mlAnalysisResult?.impact?.score ?? null;

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (params.mlAnalysisResult?.risks && params.mlAnalysisResult.risks.length > 0) {
        const highestRisk = params.mlAnalysisResult.risks.reduce((max, risk) => {
          const riskLevels = { low: 1, medium: 2, high: 3 };
          const maxLevel = riskLevels[max.level] || 1;
          const currentLevel = riskLevels[risk.level] || 1;
          return currentLevel > maxLevel ? risk : max;
        });
        riskLevel = highestRisk.level;
      } else if (codeQualityScore !== null && codeQualityScore < 50) {
        riskLevel = 'high';
      } else if (codeQualityScore !== null && codeQualityScore < 70) {
        riskLevel = 'medium';
      }

      const { error } = await supabase
        .from('pr_analysis_history')
        .insert({
          user_id: user.id,
          repository_owner: params.repositoryOwner,
          repository_name: params.repositoryName,
          pr_number: params.prNumber,
          pr_title: params.prTitle,
          pr_author: params.prAuthor,
          pr_state: params.prState,
          pr_url: params.prUrl,
          code_quality_score: codeQualityScore,
          ml_impact_score: mlImpactScore,
          risk_level: riskLevel,
          code_analysis_result: params.codeAnalysisResult as any,
          ml_analysis_result: params.mlAnalysisResult as any,
          files_changed: params.filesChanged,
          additions: params.additions,
          deletions: params.deletions,
          analysis_duration_ms: params.analysisDurationMs,
        } as any);

      if (error) {
        console.error('Failed to save analysis history:', error);
      } else {
        console.log('✅ Analysis history saved successfully');
      }
    } catch (error) {
      console.error('Error saving analysis history:', error);
    }
  }

  /**
   * Get analysis history for the current user
   */
  public async getHistory(options?: {
    repositoryOwner?: string;
    repositoryName?: string;
    limit?: number;
    daysAgo?: number;
  }): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('pr_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false });

      if (options?.repositoryOwner && options?.repositoryName) {
        query = query
          .eq('repository_owner', options.repositoryOwner)
          .eq('repository_name', options.repositoryName);
      }

      if (options?.daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - options.daysAgo);
        query = query.gte('analyzed_at', date.toISOString());
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }
}
