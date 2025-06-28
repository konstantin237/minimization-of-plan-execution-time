// Динамическое программирование для задачи о назначениях с ограничениями по C и T
// C, T — квадратные матрицы, S_limit — ограничение на сумму C, T_type ('min'/'max'), T_limit — ограничение на T
export function dpAssignment(C, T, S_limit = null, T_type = 'min', T_limit = null) {
  const n = C.length;
  const full = (1 << n) - 1;
  let dp = Array(1 << n).fill(null).map(() => ({}));
  dp[0][0] = { sumC: 0, times: [] };
  for (let mask = 0; mask < (1 << n); mask++) {
    let i = countBits(mask);
    if (i >= n) continue;
    for (let sumCstr in dp[mask]) {
      let { sumC, times, perm } = dp[mask][sumCstr];
      for (let j = 0; j < n; j++) {
        if (!(mask & (1 << j))) {
          let newSumC = sumC + C[i][j];
          if (S_limit !== null && newSumC > S_limit) continue;
          let newTimes = times.concat([T[i][j]]);
          let newPerm = perm ? perm.concat([j]) : [j];
          let newMask = mask | (1 << j);
          let key = newSumC;
          if (!dp[newMask][key] || dp[newMask][key].sumC > newSumC) {
            dp[newMask][key] = { sumC: newSumC, times: newTimes, perm: newPerm };
          }
        }
      }
    }
  }
  // Выбор лучшего решения
  let best = null, bestT = T_type === 'min' ? Infinity : -Infinity, bestS = Infinity;
  for (let sumCstr in dp[full]) {
    let { sumC, times, perm } = dp[full][sumCstr];
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
        best = perm;
        bestT = Tval;
        bestS = sumC;
      }
    }
  }
  if (!best) return null;
  return { assignment: best, cost: bestS, T_value: bestT };
  function countBits(x) {
    let c = 0;
    while (x) { c += x & 1; x >>= 1; }
    return c;
  }
} 