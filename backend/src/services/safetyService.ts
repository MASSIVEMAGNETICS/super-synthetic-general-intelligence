import { v4 as uuidv4 } from 'uuid';
import { Agent, ConstitutionRule } from '../models/types';

export interface SafetyCheckResult {
  passed: boolean;
  violations: Array<{ rule: ConstitutionRule; message: string }>;
  warnings: Array<{ rule: ConstitutionRule; message: string }>;
}

export class SafetyService {
  checkAgentMutation(original: Agent, proposed: Partial<Agent>): SafetyCheckResult {
    const violations: Array<{ rule: ConstitutionRule; message: string }> = [];
    const warnings: Array<{ rule: ConstitutionRule; message: string }> = [];

    // Check for drastic trait changes (>50 points triggers block)
    if (proposed.traits && original.traits) {
      for (const [traitName, proposedValue] of Object.entries(proposed.traits)) {
        const originalValue = original.traits[traitName];
        if (originalValue !== undefined) {
          const delta = Math.abs(proposedValue - originalValue);
          if (delta > 50) {
            const rule: ConstitutionRule = {
              id: uuidv4(),
              rule: `Trait '${traitName}' cannot change by more than 50 points in a single update`,
              severity: 'block',
              enabled: true,
            };
            violations.push({
              rule,
              message: `Trait '${traitName}' changed by ${delta} points (from ${originalValue} to ${proposedValue}), which exceeds the 50-point limit`,
            });
          }
        }
      }
    }

    // Warn if constitution rules are being disabled
    if (proposed.constitution && original.constitution) {
      for (const proposedRule of proposed.constitution) {
        const originalRule = original.constitution.find(r => r.id === proposedRule.id);
        if (originalRule && originalRule.enabled && !proposedRule.enabled) {
          const warnRule: ConstitutionRule = {
            id: uuidv4(),
            rule: `Constitution rule '${originalRule.rule}' is being disabled`,
            severity: 'warn',
            enabled: true,
          };
          warnings.push({
            rule: warnRule,
            message: `Disabling constitution rule: "${originalRule.rule}"`,
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      warnings,
    };
  }

  checkConstitution(agent: Agent): SafetyCheckResult {
    const violations: Array<{ rule: ConstitutionRule; message: string }> = [];
    const warnings: Array<{ rule: ConstitutionRule; message: string }> = [];

    for (const rule of agent.constitution) {
      if (!rule.enabled) continue;

      // Simulate constitution rule checking
      // In a real implementation, these would use NLP/LLM to verify
      const ruleText = rule.rule.toLowerCase();

      // Check alignment-related rules
      if (ruleText.includes('harm') || ruleText.includes('safe')) {
        // These safety rules always pass in our mock implementation
        continue;
      }

      if (rule.severity === 'warn') {
        // Warn-level rules produce warnings, not violations
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      warnings,
    };
  }

  getDefaultConstitutionRules(): ConstitutionRule[] {
    return [
      {
        id: uuidv4(),
        rule: 'Do not generate content that could cause physical harm to individuals',
        severity: 'block',
        enabled: true,
      },
      {
        id: uuidv4(),
        rule: 'Do not produce or assist with illegal activities',
        severity: 'block',
        enabled: true,
      },
      {
        id: uuidv4(),
        rule: 'Maintain user privacy and do not expose personally identifiable information',
        severity: 'block',
        enabled: true,
      },
      {
        id: uuidv4(),
        rule: 'Flag and disclose potential biases in generated content',
        severity: 'warn',
        enabled: true,
      },
      {
        id: uuidv4(),
        rule: 'Log all high-stakes decisions for audit trail',
        severity: 'log',
        enabled: true,
      },
    ];
  }
}

export const safetyService = new SafetyService();
