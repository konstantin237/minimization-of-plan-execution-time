import { branchAndBoundStrictAssignment } from './branch_and_bound_strict.js';
import { astarAssignment } from './astar_assignment.js';

// Model
class AssignmentModel {
  constructor(size = 3) {
    this.size = size;
    this.C = Array.from({ length: size }, () => Array(size).fill(0));
    this.T = Array.from({ length: size }, () => Array(size).fill(0));
    this.S = 0;
    this.T_type = 'min';
    this.T_limit = '';
  }

  setMatrixC(C) { this.C = C; }
  setMatrixT(T) { this.T = T; }
  setS(S) { this.S = S; }
  setTType(T_type) { this.T_type = T_type; }
  setTLimit(T_limit) { this.T_limit = T_limit; }

  // Генерация всех перестановок работ для n работников
  static permutations(arr) {
    if (arr.length === 1) return [arr];
    let result = [];
    for (let i = 0; i < arr.length; i++) {
      let rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (let perm of AssignmentModel.permutations(rest)) {
        result.push([arr[i]].concat(perm));
      }
    }
    return result;
  }

  // Решение задачи о назначениях перебором
  solve(params = {}) {
    const n = this.size;
    const jobs = Array.from({ length: n }, (_, i) => i);
    const perms = AssignmentModel.permutations(jobs);
    let solutions = [];
    let prevT = null;
    for (let perm of perms) {
      let sumC = 0;
      let times = [];
      let table = [];
      for (let i = 0; i < n; i++) {
        let c = this.C[i][perm[i]];
        let t = this.T[i][perm[i]];
        sumC += c;
        times.push(t);
        table.push({ worker: i + 1, job: perm[i] + 1, c, t });
      }
      let T_value = this.T_type === 'min' ? Math.max(...times) : Math.min(...times);
      let valid = true;
      if (this.S && sumC > this.S) valid = false;
      if (params.skipIncreasingTime) {
        if (prevT !== null && T_value > prevT) {
          continue;
        }
        prevT = T_value;
      }
      if (params.hideInvalidSolutions && !valid) continue;
      solutions.push({ perm, sumC, T_value, table, valid });
    }
    // Новый алгоритм выбора ответа:
    let filtered = solutions.filter(s => s.valid);
    if (this.T_limit !== '') {
      if (this.T_type === 'min') {
        filtered = filtered.filter(s => s.T_value <= this.T_limit);
      } else {
        filtered = filtered.filter(s => s.T_value >= this.T_limit);
      }
    }
    if (filtered.length === 0) return { answer: 'Нет допустимых решений', solutions };
    // 1. Находим минимальное T
    let minT = Math.min(...filtered.map(s => s.T_value));
    let minTsolutions = filtered.filter(s => s.T_value === minT);
    // 2. Среди них ищем минимальное S
    let minS = Math.min(...minTsolutions.map(s => s.sumC));
    let bestSolutions = minTsolutions.filter(s => s.sumC === minS);
    // 3. Если одно — выводим как раньше, если несколько — массив
    let answer;
    if (bestSolutions.length === 1) {
      answer = bestSolutions[0];
    } else {
      answer = bestSolutions;
    }
    return { answer, solutions };
  }
}

// View
class AssignmentView {
  constructor() {
    this.matrixCTextarea = document.getElementById('matrix-c-textarea');
    this.matrixTTextarea = document.getElementById('matrix-t-textarea');
    this.syncTextareas();
  }
  syncTextareas() {
    const c = this.matrixCTextarea;
    const t = this.matrixTTextarea;
    if (!c || !t) return;
    function sync(from, to) {
      to.style.height = from.style.height;
    }
    c.addEventListener('input', () => {
      c.style.height = 'auto';
      c.style.height = c.scrollHeight + 'px';
      sync(c, t);
    });
    t.addEventListener('input', () => {
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
      sync(t, c);
    });
    // Инициализация
    setTimeout(() => {
      c.style.height = 'auto';
      t.style.height = 'auto';
      c.style.height = c.scrollHeight + 'px';
      t.style.height = t.scrollHeight + 'px';
      if (c.scrollHeight > t.scrollHeight) t.style.height = c.style.height;
      else c.style.height = t.style.height;
    }, 0);
  }
  parseMatrixFromTextarea(textareaValue) {
    const lines = textareaValue.trim().split('\n').filter(line => line.trim() !== '');
    const matrix = lines.map(line => line.trim().split(/\s+/).map(Number));
    const rowLens = matrix.map(row => row.length);
    const allEqual = rowLens.every(l => l === rowLens[0]);
    return { matrix, size: matrix.length, isSquare: allEqual && matrix.length === rowLens[0] };
  }
  getParams() {
    return {
      S: +document.getElementById('salary-fund').value,
      T_type: document.getElementById('t-type').value,
      T_limit: document.getElementById('t-limit').value === '' ? '' : +document.getElementById('t-limit').value,
      skipIncreasingTime: document.getElementById('skip-increasing-time').checked,
      hideInvalidSolutions: document.getElementById('hide-invalid-solutions').checked,
      solveFull: document.getElementById('solve-full') ? document.getElementById('solve-full').checked : true,
      solveBnbStrict: document.getElementById('solve-bnb-strict') ? document.getElementById('solve-bnb-strict').checked : true,
      solveAstar: document.getElementById('solve-astar') ? document.getElementById('solve-astar').checked : true
    };
  }
  getMatrixC() {
    if (!this.matrixCTextarea) return { matrix: [], size: 0, isSquare: false };
    return this.parseMatrixFromTextarea(this.matrixCTextarea.value);
  }
  getMatrixT() {
    if (!this.matrixTTextarea) return { matrix: [], size: 0, isSquare: false };
    return this.parseMatrixFromTextarea(this.matrixTTextarea.value);
  }
  renderAnswer(answer, solutions) {
    const answerEl = document.getElementById('answer');
    if (typeof answer === 'string') {
      answerEl.textContent = answer;
      return;
    }
    // Если несколько решений — выводим все с их номерами из solutions
    if (Array.isArray(answer)) {
      let html = '';
      answer.forEach((ans) => {
        // Найти номер решения в solutions (индекс + 1)
        let idx = solutions.findIndex(s => JSON.stringify(s.perm) === JSON.stringify(ans.perm));
        html += `<b>Решение №${idx + 1}</b>`;
        html += '<table><thead><tr><th></th><th><b>Решение</b></th></tr></thead><tbody>';
        for (let i = 0; i < ans.perm.length; i++) {
          html += `<tr><th>x${i + 1}</th><td>${ans.perm[i] + 1} (C: ${ans.table[i].c}, T: ${ans.table[i].t})</td></tr>`;
        }
        html += `<tr><th>S</th><td>${ans.sumC}</td></tr>`;
        html += `<tr><th>T</th><td>${ans.T_value}</td></tr>`;
        html += '</tbody></table>';
      });
      answerEl.innerHTML = html;
      return;
    }
    // Обычный вывод для одного решения с его номером
    let idx = solutions.findIndex(s => JSON.stringify(s.perm) === JSON.stringify(answer.perm));
    let html = `<b>Решение №${idx + 1}</b>`;
    html += '<table><thead><tr><th></th><th><b>Решение</b></th></tr></thead><tbody>';
    for (let i = 0; i < answer.perm.length; i++) {
      html += `<tr><th>x${i + 1}</th><td>${answer.perm[i] + 1} (C: ${answer.table[i].c}, T: ${answer.table[i].t})</td></tr>`;
    }
    html += `<tr><th>S</th><td>${answer.sumC}</td></tr>`;
    html += `<tr><th>T</th><td>${answer.T_value}</td></tr>`;
    html += '</tbody></table>';
    answerEl.innerHTML = html;
  }
  renderSolutionTable(solutions) {
    const tableDiv = document.getElementById('solution-table');
    if (!solutions || solutions.length === 0) { tableDiv.innerHTML = ''; return; }
    const n = solutions[0].perm.length;
    let html = '<table><thead><tr><th></th>';
    solutions.forEach((sol, idx) => {
      html += `<th${sol.valid ? '' : ' style=\"opacity:0.5\"'}>Решение № ${idx + 1}</th>`;
    });
    html += '</tr></thead><tbody>';
    for (let i = 0; i < n; i++) {
      html += `<tr><th>x${i + 1}</th>`;
      solutions.forEach((sol) => {
        const jobIdx = sol.perm[i];
        const c = sol.table[i].c;
        const t = sol.table[i].t;
        html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${jobIdx + 1} (C: ${c}, T: ${t})</td>`;
      });
      html += '</tr>';
    }
    html += '<tr><th>S</th>';
    solutions.forEach((sol) => {
      html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${sol.sumC}</td>`;
    });
    html += '</tr>';
    html += '<tr><th>T</th>';
    solutions.forEach((sol) => {
      html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${sol.T_value}</td>`;
    });
    html += '</tr>';
    html += '</tbody></table>';
    tableDiv.innerHTML = html;
  }
  renderFullEnumeration(C, T, params) {
    // Реализация полного перебора (перестановки)
    const n = C.length;
    if (!n || C.some(row => row.length !== n)) return '<div>Матрица должна быть квадратной</div>';
    let jobs = Array.from({ length: n }, (_, i) => i);
    let minT = Infinity, minS = Infinity, bests = [];
    let all = [];
    function* permute(a, l, r) {
      if (l === r) yield a.slice();
      else {
        for (let i = l; i <= r; i++) {
          [a[l], a[i]] = [a[i], a[l]];
          yield* permute(a, l+1, r);
          [a[l], a[i]] = [a[i], a[l]];
        }
      }
    }
    for (let perm of permute(jobs, 0, n-1)) {
      let sumC = 0, times = [];
      for (let i = 0; i < n; i++) {
        sumC += C[i][perm[i]];
        times.push(T[i][perm[i]]);
      }
      let Tval = params.T_type === 'min' ? Math.max(...times) : Math.min(...times);
      all.push({ perm: perm.slice(), sumC, Tval });
    }
    // Найти все равновыгодные решения
    minT = Math.min(...all.map(x => x.Tval));
    let minTsolutions = all.filter(x => x.Tval === minT);
    minS = Math.min(...minTsolutions.map(x => x.sumC));
    bests = minTsolutions.filter(x => x.sumC === minS);
    if (!bests.length) return '<div>Нет решений</div>';
    let html = '<h3>Полный перебор</h3>';
    bests.forEach((best, idx) => {
      html += `<b>Решение №${idx + 1}</b>`;
      html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
      for (let i = 0; i < n; i++) {
        html += `<tr><th>x${i + 1}</th><td>${best.perm[i] + 1} (C: ${C[i][best.perm[i]]}, T: ${T[i][best.perm[i]]})</td></tr>`;
      }
      html += `<tr><th>S</th><td>${best.sumC}</td></tr>`;
      html += `<tr><th>T</th><td>${best.Tval}</td></tr>`;
      html += '</tbody></table>';
    });
    // Ход решения
    html += '<details><summary>Ход решения</summary>';
    html += '<table><thead><tr><th>Перестановка</th><th>S</th><th>T</th></tr></thead><tbody>';
    all.forEach(x => {
      html += `<tr><td>${x.perm.map(i => i + 1).join('-')}</td><td>${x.sumC}</td><td>${x.Tval}</td></tr>`;
    });
    html += '</tbody></table></details>';
    return html;
  }
  renderBnbStrict(C, T, params) {
    // Корректная обработка ограничений
    const S = (params.S === '' || isNaN(params.S)) ? null : params.S;
    const T_limit = (params.T_limit === '' || isNaN(params.T_limit)) ? null : params.T_limit;
    let allSolutions = [];
    // Модифицируем branchAndBoundStrictAssignment для сбора всех решений
    function collectAllBnB(C, T, S_limit, T_type, T_limit) {
      const n = C.length;
      let bestT = T_type === 'min' ? Infinity : -Infinity;
      let bestS = Infinity;
      let all = [];
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
            all.push({ perm: perm.slice(), sumC, Tval });
            if ((T_type === 'min' && (Tval < bestT || (Tval === bestT && sumC < bestS))) ||
                (T_type === 'max' && (Tval > bestT || (Tval === bestT && sumC < bestS)))) {
              bestT = Tval;
              bestS = sumC;
            }
          }
          return;
        }
        for (let j = 0; j < n; j++) {
          if (!used[j]) {
            let newSumC = sumC + C[i][j];
            if (S_limit !== null && newSumC > S_limit) continue;
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
      // Выбрать все равновыгодные
      let bests = all.filter(x => x.Tval === bestT && x.sumC === bestS);
      return { bests, all };
    }
    let { bests, all } = collectAllBnB(C, T, S, params.T_type, T_limit);
    let html = '<h3>Ветвей и границ (строгий)</h3>';
    if (bests.length) {
      bests.forEach((best, idx) => {
        html += `<b>Решение №${idx + 1}</b>`;
        html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
        for (let i = 0; i < C.length; i++) {
          html += `<tr><th>x${i + 1}</th><td>${best.perm[i] + 1} (C: ${C[i][best.perm[i]]}, T: ${T[i][best.perm[i]]})</td></tr>`;
        }
        html += `<tr><th>S</th><td>${best.sumC}</td></tr>`;
        html += `<tr><th>T</th><td>${best.Tval}</td></tr>`;
        html += '</tbody></table>';
      });
    } else {
      html += '<div>Нет допустимого решения</div>';
    }
    // Ход решения
    html += '<details><summary>Ход решения</summary>';
    html += '<table><thead><tr><th>Перестановка</th><th>S</th><th>T</th></tr></thead><tbody>';
    all.forEach(x => {
      html += `<tr><td>${x.perm.map(i => i + 1).join('-')}</td><td>${x.sumC}</td><td>${x.Tval}</td></tr>`;
    });
    html += '</tbody></table></details>';
    return html;
  }
  renderAstar(C, T, params) {
    // Корректная обработка ограничений
    const S = (params.S === '' || isNaN(params.S)) ? null : params.S;
    const T_limit = (params.T_limit === '' || isNaN(params.T_limit)) ? null : params.T_limit;
    // Модифицируем astarAssignment для сбора всех решений
    function collectAllAstar(C, T, S_limit, T_type, T_limit) {
      const n = C.length;
      let bestT = T_type === 'min' ? Infinity : -Infinity;
      let bestS = Infinity;
      let all = [];
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
            all.push({ perm: perm.slice(), sumC, Tval });
            if ((T_type === 'min' && (Tval < bestT || (Tval === bestT && sumC < bestS))) ||
                (T_type === 'max' && (Tval > bestT || (Tval === bestT && sumC < bestS)))) {
              bestT = Tval;
              bestS = sumC;
            }
          }
          return;
        }
        for (let j = 0; j < n; j++) {
          if (!used[j]) {
            let newSumC = sumC + C[i][j];
            if (S_limit !== null && newSumC > S_limit) continue;
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
      // Выбрать все равновыгодные
      let bests = all.filter(x => x.Tval === bestT && x.sumC === bestS);
      return { bests, all };
    }
    let { bests, all } = collectAllAstar(C, T, S, params.T_type, T_limit);
    let html = '<h3>A* (A-star)</h3>';
    if (bests.length) {
      bests.forEach((best, idx) => {
        html += `<b>Решение №${idx + 1}</b>`;
        html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
        for (let i = 0; i < C.length; i++) {
          html += `<tr><th>x${i + 1}</th><td>${best.perm[i] + 1} (C: ${C[i][best.perm[i]]}, T: ${T[i][best.perm[i]]})</td></tr>`;
        }
        html += `<tr><th>S</th><td>${best.sumC}</td></tr>`;
        html += `<tr><th>T</th><td>${best.Tval}</td></tr>`;
        html += '</tbody></table>';
      });
    } else {
      html += '<div>Нет допустимого решения</div>';
    }
    // Ход решения
    html += '<details><summary>Ход решения</summary>';
    html += '<table><thead><tr><th>Перестановка</th><th>S</th><th>T</th></tr></thead><tbody>';
    all.forEach(x => {
      html += `<tr><td>${x.perm.map(i => i + 1).join('-')}</td><td>${x.sumC}</td><td>${x.Tval}</td></tr>`;
    });
    html += '</tbody></table></details>';
    return html;
  }
  renderExtraMethods(Craw, params) {
    const extraDiv = document.getElementById('extra-methods');
    let html = '';
    const C = Craw;
    const { matrix: T } = this.getMatrixT();
    if (params.solveBnbStrict) {
      html += this.renderBnbStrict(C, T, params);
    }
    if (params.solveAstar) {
      html += this.renderAstar(C, T, params);
    }
    extraDiv.innerHTML = html;
  }
}

// Controller
class AssignmentController {
  constructor() {
    this.model = null;
    this.view = new AssignmentView();
    this.initEvents();
    this.initPresetButtons();
  }
  initEvents() {
    document.getElementById('solve-btn').addEventListener('click', () => this.solve());
  }
  initPresetButtons() {
    const cTextarea = document.getElementById('matrix-c-textarea');
    const tTextarea = document.getElementById('matrix-t-textarea');
    const sInput = document.getElementById('salary-fund');
    document.getElementById('fill-default').addEventListener('click', () => {
      cTextarea.value = `3 4 5 8 3\n2 9 6 7 8\n5 1 8 5 2\n8 9 6 4 3\n3 2 5 7 9`;
      tTextarea.value = `7 6 5 2 7\n8 1 4 3 2\n5 9 2 5 8\n2 1 4 6 7\n7 8 5 3 1`;
      sInput.value = 33;
      cTextarea.dispatchEvent(new Event('input'));
      tTextarea.dispatchEvent(new Event('input'));
    });
    document.getElementById('fill-test').addEventListener('click', () => {
      cTextarea.value = `2 2 2\n2 2 2\n2 2 2`;
      tTextarea.value = `1 1 2\n1 2 1\n2 1 1`;
      sInput.value = 6;
      cTextarea.dispatchEvent(new Event('input'));
      tTextarea.dispatchEvent(new Event('input'));
    });
    document.getElementById('clear-all').addEventListener('click', () => {
      cTextarea.value = '';
      tTextarea.value = '';
      sInput.value = '';
      cTextarea.dispatchEvent(new Event('input'));
      tTextarea.dispatchEvent(new Event('input'));
    });
  }
  solve() {
    const { matrix: C, size: sizeC, isSquare } = this.view.getMatrixC();
    const { matrix: T, size: sizeT } = this.view.getMatrixT();
    window.assignmentModelInputC = C;
    window.assignmentModelInputT = T;
    const n = Math.min(sizeC, sizeT);
    if (!n || C.length !== n || T.length !== n) {
      this.view.renderAnswer('Ошибка: некорректный ввод матриц');
      this.view.renderSolutionTable([]);
      document.getElementById('extra-methods').innerHTML = '';
      return;
    }
    this.model = new AssignmentModel(n);
    this.model.setMatrixC(C);
    this.model.setMatrixT(T);
    const params = this.view.getParams();
    this.model.setS(params.S);
    this.model.setTType(params.T_type);
    this.model.setTLimit(params.T_limit);
    const { answer, solutions } = this.model.solve(params);
    this.view.renderAnswer(answer.answer || answer, solutions);
    this.view.renderSolutionTable(solutions);
    this.view.renderExtraMethods(C, params);
  }
}

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
  new AssignmentController();
}); 