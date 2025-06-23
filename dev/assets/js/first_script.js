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
  constructor(size = 3) {
    this.size = size;
    this.matrixCTextarea = document.getElementById('matrix-c-textarea');
    this.matrixTTextarea = document.getElementById('matrix-t-textarea');
    this.initTextareas();
    // Сделать S пустым по умолчанию
    const salaryFundInput = document.getElementById('salary-fund');
    if (salaryFundInput) salaryFundInput.value = '';
  }

  initTextareas() {
    // Устанавливаем размер textarea в зависимости от размера матрицы
    if (this.matrixCTextarea) {
      this.matrixCTextarea.rows = this.size;
      this.matrixCTextarea.cols = this.size * 3; // Примерная ширина для элементов
    }
    if (this.matrixTTextarea) {
      this.matrixTTextarea.rows = this.size;
      this.matrixTTextarea.cols = this.size * 3; // Примерная ширина для элементов
    }
  }

  // Парсинг матрицы из textarea
  parseMatrixFromTextarea(textareaValue) {
    const lines = textareaValue.trim().split('\n');
    const matrix = [];
    
    for (let i = 0; i < this.size; i++) {
      if (i < lines.length) {
        const line = lines[i].trim();
        const elements = line.split(/\s+/).filter(el => el !== '');
        const row = [];
        
        for (let j = 0; j < this.size; j++) {
          if (j < elements.length) {
            const value = parseFloat(elements[j]);
            row.push(isNaN(value) ? 0 : value);
          } else {
            row.push(0);
          }
        }
        matrix.push(row);
      } else {
        // Если строк недостаточно, заполняем нулями
        matrix.push(Array(this.size).fill(0));
      }
    }
    
    return matrix;
  }

  getMatrixC() {
    if (!this.matrixCTextarea) return Array.from({ length: this.size }, () => Array(this.size).fill(0));
    return this.parseMatrixFromTextarea(this.matrixCTextarea.value);
  }

  getMatrixT() {
    if (!this.matrixTTextarea) return Array.from({ length: this.size }, () => Array(this.size).fill(0));
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
    // answer.perm — массив работ для каждого работника
    // answer.table — массив объектов с c, t
    // answer.sumC, answer.T_value
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
    let html = '<table><thead><tr><th></th>';
    // Заголовки: Решение 1, Решение 2, ...
    solutions.forEach((sol, idx) => {
      html += `<th${sol.valid ? '' : ' style=\"opacity:0.5\"'}>Решение № ${idx + 1}</th>`;
    });
    html += '</tr></thead><tbody>';
    // Для каждого работника — строка
    for (let i = 0; i < this.size; i++) {
      html += `<tr><th>Работник ${i + 1}</th>`;
      solutions.forEach((sol, idx) => {
        // Найти работу, которую выполняет этот работник в этом решении
        const jobIdx = sol.perm[i];
        const c = sol.table[i].c;
        const t = sol.table[i].t;
        html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${jobIdx + 1} (C: ${c}, T: ${t})</td>`;
      });
      html += '</tr>';
    }
    // Строка S (сумма C)
    html += '<tr><th>S</th>';
    solutions.forEach((sol) => {
      html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${sol.sumC}</td>`;
    });
    html += '</tr>';
    // Строка T
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
  constructor(size = 3) {
    this.model = new AssignmentModel(size);
    this.view = new AssignmentView(size);
    this.initEvents();
  }

  initEvents() {
    document.getElementById('solve-btn').addEventListener('click', () => this.solve());
  }

  solve() {
    this.model.setMatrixC(this.view.getMatrixC());
    this.model.setMatrixT(this.view.getMatrixT());
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
  new AssignmentController(3);
}); 