import { AnalyzeNameUseCase } from '../application/use-cases/AnalyzeNameUseCase';
import { DeepDiveReport } from '../products/DeepDiveReport';
import { CompatibilityEngine } from '../products/CompatibilityEngine';
import { BrandDiagnostic } from '../products/BrandDiagnostic';
import { TemporalTracker } from '../products/TemporalTracker';
import { ContextMode } from '../ai/ContextAwarePrompter';

export interface ApiRequest {
  method: 'GET' | 'POST';
  path: string;
  body?: any;
  query?: Record<string, string>;
}

export interface ApiResponse {
  status: number;
  body: any;
}

export interface ApiDeps {
  analyzeName: AnalyzeNameUseCase;
  deepDive?: DeepDiveReport;
  compatibility?: CompatibilityEngine;
  brand?: BrandDiagnostic;
  temporal?: TemporalTracker;
}

export class RequestHandler {
  private deepDive: DeepDiveReport;
  private compatibility: CompatibilityEngine;
  private brand: BrandDiagnostic;
  private temporal: TemporalTracker;

  constructor(private deps: ApiDeps) {
    this.deepDive = deps.deepDive ?? new DeepDiveReport();
    this.compatibility = deps.compatibility ?? new CompatibilityEngine();
    this.brand = deps.brand ?? new BrandDiagnostic();
    this.temporal = deps.temporal ?? new TemporalTracker();
  }

  handle(req: ApiRequest): ApiResponse {
    try {
      if (req.method === 'GET' && req.path === '/health') {
        return { status: 200, body: { ok: true, service: 'KnowledgeAtlas API', version: '1.0.0' } };
      }
      if (req.method === 'GET' && req.path === '/products') {
        return { status: 200, body: { products: this.productList() } };
      }
      if (req.method === 'POST' && req.path === '/analyze') {
        return this.handleAnalyze(req.body);
      }
      if (req.method === 'POST' && req.path === '/deep-dive') {
        return this.handleDeepDive(req.body);
      }
      if (req.method === 'POST' && req.path === '/compatibility') {
        return this.handleCompatibility(req.body);
      }
      if (req.method === 'POST' && req.path === '/brand') {
        return this.handleBrand(req.body);
      }
      if (req.method === 'POST' && req.path === '/temporal') {
        return this.handleTemporal(req.body);
      }
      return { status: 404, body: { error: 'endpoint_not_found', path: req.path } };
    } catch (e: any) {
      return { status: 500, body: { error: 'internal_error', message: e?.message ?? 'unknown' } };
    }
  }

  private productList(): Array<{ id: string; name: string; endpoint: string }> {
    return [
      { id: 'analyze', name: 'تحليل أساسي', endpoint: 'POST /analyze' },
      { id: 'deep-dive', name: 'التقرير العميق', endpoint: 'POST /deep-dive' },
      { id: 'compatibility', name: 'محرك التوافق', endpoint: 'POST /compatibility' },
      { id: 'brand', name: 'التشخيص التجاري', endpoint: 'POST /brand' },
      { id: 'temporal', name: 'المتتبع الزمني', endpoint: 'POST /temporal' },
    ];
  }

  private handleAnalyze(body: any): ApiResponse {
    if (!body?.name || typeof body.name !== 'string') {
      return { status: 400, body: { error: 'missing_name' } };
    }
    const result = this.deps.analyzeName.execute({ name: body.name });
    return { status: 200, body: result };
  }

  private handleDeepDive(body: any): ApiResponse {
    if (!body?.name) return { status: 400, body: { error: 'missing_name' } };
    const analysis = this.deps.analyzeName.execute({ name: body.name });
    if (analysis.status !== 'full') {
      return { status: 200, body: { status: 'abstained', report: analysis.report } };
    }
    const mode: ContextMode = body.mode ?? 'personal';
    const out = this.deepDive.generate(analysis, mode);
    return { status: 200, body: out };
  }

  private handleCompatibility(body: any): ApiResponse {
    if (!body?.nameA || !body?.nameB) {
      return { status: 400, body: { error: 'missing_names' } };
    }
    const a = this.deps.analyzeName.execute({ name: body.nameA });
    const b = this.deps.analyzeName.execute({ name: body.nameB });
    const out = this.compatibility.compare(a, b);
    return { status: 200, body: out };
  }

  private handleBrand(body: any): ApiResponse {
    if (!body?.name) return { status: 400, body: { error: 'missing_name' } };
    const analysis = this.deps.analyzeName.execute({ name: body.name });
    const out = this.brand.analyze(analysis, body.activity);
    return { status: 200, body: out };
  }

  private handleTemporal(body: any): ApiResponse {
    if (!body?.name) return { status: 400, body: { error: 'missing_name' } };
    const analysis = this.deps.analyzeName.execute({ name: body.name });
    const days = typeof body.days === 'number' ? body.days : 28;
    const out = this.temporal.generate(analysis, new Date(), days);
    return { status: 200, body: out };
  }
}
