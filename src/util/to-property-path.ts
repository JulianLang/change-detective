export function toPropertyPath(basePath: string, property: PropertyKey): string {
  return basePath === '' ? String(property) : `${basePath}.${String(property)}`;
}
