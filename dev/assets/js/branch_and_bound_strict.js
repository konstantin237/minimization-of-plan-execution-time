// Метод ветвей и границ для задачи о назначениях с ограничениями по C и T
// C, T — квадратные матрицы, S_limit — ограничение на сумму C, T_type ('min'/'max'), T_limit — ограничение на T
export function branchAndBoundStrictAssignment(C, T, S_limit = null, T_type = 'min', T_limit = null) {
  const n = C.length;
  let best = null;
  let bestT = T_type === 'min' ? Infinity : -Infinity;
  let bestS = Infinity;
  function dfs(i, used, perm, sumC, times) {
    if (i === n) {
      let Tval = T_type === 'min' ? Math.max(...times) : Math.min(...times);
      let valid = true;
      if (S_limit !== null && sumC > S_limit) valid = false;
      if (T_limit !== null) {
        if (T_type === 'min' && Tval > T_limit) valid = false;
        if (T_type === 'max' && Tval < T_limit) valid = false;
      }
      if (valid) {
        if ((T_type === 'min' && (Tval < bestT || (Tval === bestT && sumC < bestS))) ||
            (T_type === 'max' && (Tval > bestT || (Tval === bestT && sumC < bestS)))) {
          best = perm.slice();
          bestT = Tval;
          bestS = sumC;
        }
      }
      return;
    }
    for (let j = 0; j < n; j++) {
      if (!used[j]) {
        let newSumC = sumC + C[i][j];
        if (S_limit !== null && newSumC > S_limit) continue; // отсечение по C
        used[j] = true;
        perm.push(j);
        times.push(T[i][j]);
        dfs(i + 1, used, perm, newSumC, times);
        used[j] = false;
        perm.pop();
        times.pop();
      }
    }
  }
  dfs(0, Array(n).fill(false), [], 0, []);
  if (!best) return null;
  return { assignment: best, cost: bestS, T_value: bestT };
} 