import { ScientificProduct } from '../types';

export function productDateLabel(product: ScientificProduct): string {
  const date = product.type === 'publicacion' ? product.publicationDate : product.projectStartDate;
  if (!date) return String(product.year);

  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? String(product.year)
    : parsed.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function productDateValue(product: ScientificProduct): string {
  return product.type === 'publicacion'
    ? product.publicationDate || String(product.year)
    : product.projectStartDate || String(product.year);
}
