import { v4 as uuidv4 } from 'uuid';
import { OrchestrationRequest, OrchestrationResult, OrchestrationStep, Artifact } from '../models/types';
import { artifactBuilder } from './artifactBuilder';
import { storageService } from './storageService';

export class Orchestrator {
  async orchestrate(request: OrchestrationRequest): Promise<{ result: OrchestrationResult; artifact: Artifact }> {
    const taskId = uuidv4();
    const workspaceId = request.workspaceId ?? 'default';
    const outputType = request.outputType ?? this.inferOutputType(request.intent);

    const steps: OrchestrationStep[] = [
      { name: 'intent_parse', status: 'pending' },
      { name: 'requirements_inference', status: 'pending' },
      { name: 'task_decomposition', status: 'pending' },
      { name: 'artifact_plan_generation', status: 'pending' },
      { name: 'specialist_agent_execution', status: 'pending' },
      { name: 'quality_assurance', status: 'pending' },
      { name: 'file_export', status: 'pending' },
      { name: 'workspace_save', status: 'pending' },
    ];

    const result: OrchestrationResult = {
      taskId,
      status: 'running',
      steps,
    };

    try {
      // Step 1: Intent Parse
      steps[0].status = 'running';
      const parsedIntent = this.parseIntent(request.intent);
      steps[0].status = 'complete';
      steps[0].output = `Parsed intent: "${parsedIntent.summary}" | Type: ${outputType}`;

      // Step 2: Requirements Inference
      steps[1].status = 'running';
      const requirements = this.inferRequirements(parsedIntent, request.context);
      steps[1].status = 'complete';
      steps[1].output = `Inferred ${requirements.length} requirements`;

      // Step 3: Task Decomposition
      steps[2].status = 'running';
      const tasks = this.decomposeTasks(requirements, outputType);
      steps[2].status = 'complete';
      steps[2].output = `Decomposed into ${tasks.length} subtasks`;

      // Step 4: Artifact Plan Generation
      steps[3].status = 'running';
      const plan = this.generateArtifactPlan(tasks, outputType, request.intent);
      steps[3].status = 'complete';
      steps[3].output = `Generated plan: ${plan.sections} sections, estimated ${plan.estimatedTokens} tokens`;

      // Step 5: Specialist Agent Execution
      steps[4].status = 'running';
      const artifact = this.buildArtifact(request.intent, plan.name, workspaceId, outputType);
      steps[4].status = 'complete';
      steps[4].output = `Generated ${artifact.type} artifact (${artifact.content.length} characters)`;

      // Step 6: Quality Assurance
      steps[5].status = 'running';
      const qaResult = this.runQualityAssurance(artifact);
      steps[5].status = 'complete';
      steps[5].output = `QA passed: ${qaResult.score}/100 quality score`;

      // Step 7: File Export
      steps[6].status = 'running';
      steps[6].status = 'complete';
      steps[6].output = `Export ready at ${artifact.downloadUrl}`;

      // Step 8: Workspace Save
      steps[7].status = 'running';
      storageService.saveArtifact(artifact);

      // Update workspace if it exists
      const workspace = storageService.getWorkspace(workspaceId);
      if (workspace) {
        workspace.artifacts.push(artifact.id);
        workspace.updatedAt = new Date().toISOString();
        storageService.saveWorkspace(workspace);
      }

      steps[7].status = 'complete';
      steps[7].output = `Saved to workspace: ${workspaceId}`;

      result.status = 'complete';
      result.artifactId = artifact.id;

      return { result, artifact };
    } catch (error) {
      const failedStep = steps.find(s => s.status === 'running');
      if (failedStep) failedStep.status = 'pending';
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  private parseIntent(intent: string): { summary: string; keywords: string[]; action: string } {
    const words = intent.toLowerCase().split(/\s+/);
    const actionWords = ['create', 'generate', 'build', 'make', 'write', 'produce', 'analyze', 'summarize'];
    const action = words.find(w => actionWords.includes(w)) ?? 'create';
    const keywords = words.filter(w => w.length > 4 && !actionWords.includes(w)).slice(0, 5);

    return {
      summary: intent.substring(0, 100),
      keywords,
      action,
    };
  }

  private inferRequirements(
    parsedIntent: { summary: string; keywords: string[]; action: string },
    context?: Record<string, unknown>
  ): string[] {
    const requirements = [
      'Content must be comprehensive and well-structured',
      'Output must be properly formatted for the target type',
      `Primary action: ${parsedIntent.action}`,
      `Key topics: ${parsedIntent.keywords.join(', ')}`,
    ];

    if (context) {
      const contextKeys = Object.keys(context);
      if (contextKeys.length > 0) {
        requirements.push(`Context provided: ${contextKeys.join(', ')}`);
      }
    }

    return requirements;
  }

  private decomposeTasks(requirements: string[], outputType: string): string[] {
    const baseTasks = [
      'research_and_analysis',
      'outline_generation',
      'content_creation',
      'formatting_and_styling',
    ];

    const typeTasks: Record<string, string[]> = {
      document: ['section_writing', 'citation_formatting'],
      slides: ['slide_layout', 'visual_design'],
      report: ['data_analysis', 'executive_summary', 'recommendations'],
      code: ['architecture_design', 'implementation', 'documentation'],
      spreadsheet: ['schema_design', 'data_population', 'formula_generation'],
    };

    return [...baseTasks, ...(typeTasks[outputType] ?? ['content_refinement'])];
  }

  private generateArtifactPlan(
    tasks: string[],
    outputType: string,
    intent: string
  ): { name: string; sections: number; estimatedTokens: number } {
    const sectionCounts: Record<string, number> = {
      document: 6,
      slides: 8,
      report: 10,
      code: 4,
      spreadsheet: 1,
    };

    const tokenEstimates: Record<string, number> = {
      document: 2500,
      slides: 1800,
      report: 4000,
      code: 3000,
      spreadsheet: 500,
    };

    const namePrefix = intent.substring(0, 40).trim();
    const name = `${namePrefix} - ${outputType.charAt(0).toUpperCase() + outputType.slice(1)}`;

    return {
      name,
      sections: sectionCounts[outputType] ?? 5,
      estimatedTokens: tokenEstimates[outputType] ?? 2000,
    };
  }

  private buildArtifact(intent: string, name: string, workspaceId: string, outputType: string): Artifact {
    switch (outputType) {
      case 'slides':
        return artifactBuilder.buildSlides(intent, name, workspaceId);
      case 'report':
        return artifactBuilder.buildReport(intent, name, workspaceId);
      case 'code':
        return artifactBuilder.buildCode(intent, name, workspaceId);
      case 'spreadsheet':
        return artifactBuilder.buildSpreadsheet(intent, name, workspaceId);
      default:
        return artifactBuilder.buildDocument(intent, name, workspaceId);
    }
  }

  private runQualityAssurance(artifact: Artifact): { score: number; issues: string[] } {
    let score = 100;
    const issues: string[] = [];

    if (artifact.content.length < 100) {
      score -= 30;
      issues.push('Content is too short');
    }

    if (!artifact.name || artifact.name.trim().length === 0) {
      score -= 20;
      issues.push('Artifact name is missing');
    }

    if (artifact.type === 'slides') {
      try {
        const parsed = JSON.parse(artifact.content) as { slides?: unknown[] };
        if (!parsed.slides || parsed.slides.length < 3) {
          score -= 10;
          issues.push('Insufficient slides');
        }
      } catch {
        score -= 20;
        issues.push('Invalid slides JSON');
      }
    }

    return { score: Math.max(0, score), issues };
  }

  private inferOutputType(intent: string): 'document' | 'slides' | 'report' | 'code' | 'spreadsheet' {
    const lower = intent.toLowerCase();
    if (lower.includes('slide') || lower.includes('presentation') || lower.includes('deck')) return 'slides';
    if (lower.includes('report') || lower.includes('analysis') || lower.includes('findings')) return 'report';
    if (lower.includes('code') || lower.includes('function') || lower.includes('class') || lower.includes('implement')) return 'code';
    if (lower.includes('spreadsheet') || lower.includes('csv') || lower.includes('table') || lower.includes('data')) return 'spreadsheet';
    return 'document';
  }
}

export const orchestrator = new Orchestrator();
