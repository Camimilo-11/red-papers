export interface StudentCollaborationRecord {
  productId: string;
  contribution: string;
}

export const STUDENT_DEMO_ID = 'demo-student-ecmc';

// Asociaciones de demostración visibles solo para la cuenta estudiantil ECMC.
export const STUDENT_COLLABORATIONS: Record<string, StudentCollaborationRecord[]> = {
  [STUDENT_DEMO_ID]: [
    {productId: 'prod-002', contribution: 'Apoyo en curación y validación de datos genómicos'},
    {productId: 'prod-013', contribution: 'Colaboración en desarrollo de flujos de cálculo científico'},
    {productId: 'prod-014', contribution: 'Apoyo en análisis exploratorio de datos'},
  ],
};
