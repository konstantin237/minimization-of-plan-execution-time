// Псевдо-метод ветвей и границ для задачи о назначениях
// C — массив массивов (n x n)
export function branchAndBoundAssignment(C) {
  const n = C.length;
  if (!n || C.some(row => row.length !== n)) return null;
  let usedCols = Array(n).fill(false);
  let perm = [];
  let sumC = 0;
  for (let i = 0; i < n; i++) {
    let minVal = Infinity, minJ = -1;
    for (let j = 0; j < n; j++) {
      if (!usedCols[j] && C[i][j] < minVal) {
        minVal = C[i][j]; minJ = j;
      }
    }
    perm.push(minJ);
    usedCols[minJ] = true;
    sumC += C[i][minJ];
  }
  return {assignment: perm, cost: sumC};
} 