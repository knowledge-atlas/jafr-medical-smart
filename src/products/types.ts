export interface ReportSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  weight?: number;
}

export interface ProductMeta {
  productId: string;
  productName: string;
  version: string;
  generatedAt: string;
  offline: boolean;
}
