/**
 * Base agent — all enterprise agents extend this contract.
 */
export class BaseAgent {
  constructor(name) {
    this.name = name;
  }

  /**
   * @param {object} context - shared pipeline context
   * @returns {Promise<{ agent: string, success: boolean, confidence: number, data: object, issues: string[], durationMs: number }>}
   */
  async run(context) {
    const start = Date.now();
    try {
      const result = await this.execute(context);
      return {
        agent: this.name,
        success: result.success !== false,
        confidence: clamp(result.confidence ?? 0.8, 0, 1),
        data: result.data || {},
        issues: result.issues || [],
        durationMs: Date.now() - start,
      };
    } catch (err) {
      return {
        agent: this.name,
        success: false,
        confidence: 0,
        data: {},
        issues: [err.message],
        durationMs: Date.now() - start,
      };
    }
  }

  async execute(_context) {
    throw new Error(`${this.name}: execute() not implemented`);
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
