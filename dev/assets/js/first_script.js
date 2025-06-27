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
  solve() {
    const n = this.size;
    const jobs = Array.from({ length: n }, (_, i) => i);
    const perms = AssignmentModel.permutations(jobs);
    let solutions = [];
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
      // Не фильтруем по T_limit здесь, фильтрация будет ниже
      solutions.push({ perm, sumC, T_value, table, valid });
    }
    // Новый алгоритм выбора решения
    let filtered = solutions.filter(s => s.valid);
    if (this.T_limit !== '') {
      if (this.T_type === 'min') {
        filtered = filtered.filter(s => s.T_value <= this.T_limit);
      } else {
        filtered = filtered.filter(s => s.T_value >= this.T_limit);
      }
    }
    if (filtered.length === 0) return { answer: 'Нет допустимых решений', solutions };
    let best;
    if (this.T_type === 'min') {
      let minT = Math.min(...filtered.map(s => s.T_value));
      best = filtered.find(s => s.T_value === minT);
    } else {
      let maxT = Math.max(...filtered.map(s => s.T_value));
      best = filtered.find(s => s.T_value === maxT);
    }
    return { answer: best, solutions };
  }
}

// View
class AssignmentView {
  constructor() {
    this.matrixCTextarea = document.getElementById('matrix-c-textarea');
    this.matrixTTextarea = document.getElementById('matrix-t-textarea');
    // Сделать S по умолчанию пустым (или оставить, если будет задано в HTML)
  }

  // Новый метод: получить матрицу и размер
  parseMatrixFromTextarea(textareaValue) {
    const lines = textareaValue.trim().split('\n').filter(line => line.trim() !== '');
    const matrix = lines.map(line => line.trim().split(/\s+/).map(Number));
    // Проверка на прямоугольность (обрезать лишние элементы, если строки разной длины)
    const minLen = Math.min(...matrix.map(row => row.length));
    const squareMatrix = matrix.map(row => row.slice(0, minLen));
    return { matrix: squareMatrix, size: squareMatrix.length };
  }

  getMatrixC() {
    if (!this.matrixCTextarea) return { matrix: [], size: 0 };
    return this.parseMatrixFromTextarea(this.matrixCTextarea.value);
  }
  getMatrixT() {
    if (!this.matrixTTextarea) return { matrix: [], size: 0 };
    return this.parseMatrixFromTextarea(this.matrixTTextarea.value);
  }
  getParams() {
    return {
      S: +document.getElementById('salary-fund').value,
      T_type: document.getElementById('t-type').value,
      T_limit: document.getElementById('t-limit').value === '' ? '' : +document.getElementById('t-limit').value
    };
  }
  renderAnswer(answer) {
    const answerEl = document.getElementById('answer');
    if (typeof answer === 'string') {
      answerEl.textContent = answer;
      return;
    }
    let html = '<table><thead><tr><th></th><th><b>Решение</b></th></tr></thead><tbody>';
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
}

// Controller
class AssignmentController {
  constructor() {
    this.model = null;
    this.view = new AssignmentView();
    this.initEvents();
  }
  initEvents() {
    document.getElementById('solve-btn').addEventListener('click', () => this.solve());
  }
  solve() {
    const { matrix: C, size: sizeC } = this.view.getMatrixC();
    const { matrix: T, size: sizeT } = this.view.getMatrixT();
    window.assignmentModelInputC = C;
    window.assignmentModelInputT = T;
    const n = Math.min(sizeC, sizeT);
    if (!n || C.length !== n || T.length !== n) {
      this.view.renderAnswer('Ошибка: некорректный ввод матриц');
      this.view.renderSolutionTable([]);
      return;
    }
    this.model = new AssignmentModel(n);
    this.model.setMatrixC(C);
    this.model.setMatrixT(T);
    const params = this.view.getParams();
    this.model.setS(params.S);
    this.model.setTType(params.T_type);
    this.model.setTLimit(params.T_limit);
    const { answer, solutions } = this.model.solve();
    this.view.renderAnswer(answer.answer || answer);
    this.view.renderSolutionTable(solutions);
  }
}

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
  new AssignmentController();
}); 