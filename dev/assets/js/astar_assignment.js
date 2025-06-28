// A* (A-star) для задачи о назначениях с ограничениями по C и T
// C, T — квадратные матрицы, S_limit — ограничение на сумму C, T_type ('min'/'max'), T_limit — ограничение на T
export function astarAssignment(C, T, S_limit = null, T_type = 'min', T_limit = null) {
  const n = C.length;
  let best = null, bestT = T_type === 'min' ? Infinity : -Infinity, bestS = Infinity;
  let heap = [{
    i: 0,
    used: Array(n).fill(false),
    perm: [],
    sumC: 0,
    times: [],
    priority: 0
  }];
  function heuristic(i, used, sumC, times) {
    // Оценка остатка по C (жадно)
    let remC = 0;
    for (let k = i; k < n; k++) {
      let minC = Infinity;
      for (let j = 0; j < n; j++) if (!used[j]) minC = Math.min(minC, C[k][j]);
      remC += minC;
    }
    return sumC + remC;
  }
  while (heap.length) {
    heap.sort((a, b) => a.priority - b.priority);
    let node = heap.shift();
    let { i, used, perm, sumC, times } = node;
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
      continue;
    }
    for (let j = 0; j < n; j++) {
      if (!used[j]) {
        let newSumC = sumC + C[i][j];
        if (S_limit !== null && newSumC > S_limit) continue;
        let newUsed = used.slice();
        newUsed[j] = true;
        let newPerm = perm.concat([j]);
        let newTimes = times.concat([T[i][j]]);
        let prio = heuristic(i + 1, newUsed, newSumC, newTimes);
        heap.push({
          i: i + 1,
          used: newUsed,
          perm: newPerm,
          sumC: newSumC,
          times: newTimes,
          priority: prio
        });
      }
    }
  }
  if (!best) return null;
  return { assignment: best, cost: bestS, T_value: bestT };
} 