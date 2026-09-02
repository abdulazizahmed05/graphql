// chart elements
const passFailChartElement = document.getElementById("pass-fail-chart");
const xpGraphElement = document.getElementById("xp-graph");

export function drawPassFailPieChart(passed, failed) {
  const total = passed + failed;
  if (total === 0) {
    return;
  }
  const passedPercentage = (passed / total) * 100;
  const failedPercentage = (failed / total) * 100;
}

export function drawXpProgressionGraph(progression) {}
