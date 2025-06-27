// Венгерский алгоритм для квадратной матрицы C
// C — массив массивов (n x n)
export function hungarianMethod(C) {
  const n = C.length;
  if (!n || C.some(row => row.length !== n)) return null;
  let matrix = C.map(row => row.slice());
  for (let i = 0; i < n; i++) {
    let min = Math.min(...matrix[i]);
    for (let j = 0; j < n; j++) matrix[i][j] -= min;
  }
  for (let j = 0; j < n; j++) {
    let col = matrix.map(row => row[j]);
    let min = Math.min(...col);
    for (let i = 0; i < n; i++) matrix[i][j] -= min;
  }
  let assigned = Array(n).fill(-1);
  let usedCols = Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] === 0 && !usedCols[j]) {
        assigned[i] = j;
        usedCols[j] = true;
        break;
      }
    }
  }
  if (assigned.includes(-1)) return null;
  let cost = 0;
  for (let i = 0; i < n; i++) cost += C[i][assigned[i]];
  return {assignment: assigned, cost};
} 