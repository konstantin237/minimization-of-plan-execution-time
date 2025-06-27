// ЛП-решение задачи о назначениях (для квадратных — совпадает с венгерским)
import { hungarianMethod } from './hungarian.js';
export function lpAssignment(C) {
  return hungarianMethod(C);
} 