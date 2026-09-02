import { formatBytes, formatDate, formatXp } from "./utils.js";

export function drawPassFailPieChart(passed, failed) {
  const svg = document.getElementById("pass-fail-chart");
  svg.innerHTML = "";
  const total = passed + failed;
  if (total === 0) {
    return;
  }
  const size = 250;
  const center = size / 2;
  const radius = 95;
  const strokeWidth = 30;
  const percentage = Math.round((passed / total) * 100);
  const circumference = 2 * Math.PI * radius;
  const passedLength = (passed / total) * circumference;
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  // failed (under passed)
  const backgroundCircle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  backgroundCircle.setAttribute("cx", center);
  backgroundCircle.setAttribute("cy", center);
  backgroundCircle.setAttribute("r", radius);
  backgroundCircle.setAttribute("fill", "none");
  backgroundCircle.setAttribute("stroke", "#310303");
  backgroundCircle.setAttribute("stroke-width", strokeWidth);
  svg.appendChild(backgroundCircle);

  // passed (overlay failed)
  const passedCircle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  passedCircle.setAttribute("cx", center);
  passedCircle.setAttribute("cy", center);
  passedCircle.setAttribute("r", radius);
  passedCircle.setAttribute("fill", "none");
  passedCircle.setAttribute("stroke", "#b01111bc");
  passedCircle.setAttribute("stroke-width", strokeWidth);
  passedCircle.setAttribute(
    "stroke-dasharray",
    `${passedLength} ${circumference}`,
  );
  passedCircle.setAttribute("transform", `rotate(-90 ${center} ${center})`);
  svg.appendChild(passedCircle);

  // percentage labvel
  const percentageText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text",
  );
  percentageText.setAttribute("x", center);
  percentageText.setAttribute("y", center);
  percentageText.setAttribute("text-anchor", "middle");
  percentageText.setAttribute("dominant-baseline", "middle");
  percentageText.setAttribute("fill", "#e9dddd");
  percentageText.setAttribute("font-family", "Impact");
  percentageText.setAttribute("font-size", "30");
  percentageText.textContent = `${percentage}%`;
  svg.appendChild(percentageText);
  const labelText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text",
  );
  labelText.setAttribute("x", center);
  labelText.setAttribute("y", center + 30);
  labelText.setAttribute("text-anchor", "middle");
  labelText.setAttribute("fill", "#a89b9b");
  labelText.setAttribute("font-family", "Impact");
  labelText.setAttribute("font-size", "15");
  labelText.textContent = "PASSED";
  svg.appendChild(labelText);
}

export function drawXpProgressionGraph(progression) {
  const svg = document.getElementById("xp-graph");
  svg.innerHTML = "";
  const height = 400;
  const padding = {
    top: 40,
    right: 40,
    bottom: 80,
    left: 80,
  };
  if (!progression || progression.length === 0) {
    return;
  }
  const dates = progression.map((point) => new Date(point.date));
  const firstDate = Math.min(...dates);
  const lastDate = Math.max(...dates);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max((lastDate - firstDate) / millisecondsPerDay, 1);
  const pixelsPerDay = 9.5;
  const graphWidth = Math.max(900, totalDays * pixelsPerDay);
  const width = graphWidth + padding.left + padding.right;
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const maxXp = Math.max(...progression.map((point) => point.totalXp), 1);
  const numberOfLines = 5;

  // make grid lines
  for (let i = 0; i < numberOfLines; i++) {
    const percentage = i / (numberOfLines - 1);
    const value = maxXp * percentage;
    const y = padding.top + usableHeight * (1 - percentage);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", padding.left);
    line.setAttribute("x2", width - padding.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "rgba(150, 20, 20, 0.25)");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    // y label
    label.setAttribute("x", padding.left - 10);
    label.setAttribute("y", y + 5);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("fill", "#a89b9b");
    label.setAttribute("font-family", "Impact");
    label.setAttribute("font-size", "12");
    label.textContent = formatBytes(value, 0);
    svg.appendChild(label);
  }

  // get line coordinates, then create points and draw line
  function getX(date) {
    const currentDate = new Date(date);
    const daysFromStart = (currentDate - firstDate) / millisecondsPerDay;
    return padding.left + (daysFromStart / totalDays) * usableWidth;
  }

  function getY(totalXp) {
    return padding.top + usableHeight * (1 - totalXp / maxXp);
  }

  const points = progression
    .map((point) => {
      const x = getX(point.date);
      const y = getY(point.totalXp);
      return `${x},${y}`;
    })
    .join(" ");

  const polyline = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polyline",
  );
  polyline.setAttribute("points", points);
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "#9b1717");
  polyline.setAttribute("stroke-width", "2.5");
  polyline.setAttribute("stroke-linejoin", "round");
  polyline.setAttribute("stroke-linecap", "round");
  svg.appendChild(polyline);

  // transaction points
  progression.forEach((point) => {
    const x = getX(point.date);
    const y = getY(point.totalXp);
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 4);
    circle.setAttribute("fill", "#310303");
    circle.setAttribute("stroke", "#e9dddd");
    circle.setAttribute("stroke-width", "1.5");
    circle.style.cursor = "pointer";
    const sign = point.xp >= 0 ? "+" : "";
    // apply tooltip to hovering over points
    circle.addEventListener("mouseenter", () => {
      circle.setAttribute("r", 7);
      circle.setAttribute("fill", "#9b1717");
      tooltip.style.display = "block";
      tooltipName.textContent = point.name;
      tooltipType.textContent = point.type;
      tooltipAmount.textContent = `${sign}${formatXp(point.xp)} XP`;
      tooltipTotal.textContent = `TOTAL: ${formatXp(point.totalXp)} XP`;
      tooltipDate.textContent = point.date;
    });
    circle.addEventListener("mouseleave", () => {
      circle.setAttribute("r", 4);
      circle.setAttribute("fill", "#310303");
      tooltip.style.display = "none";
    });
    svg.appendChild(circle);
  });

  // x label
  const numberOfDateLabels = Math.min(8, progression.length);
  const labelStep = Math.max(
    1,
    Math.floor(progression.length / numberOfDateLabels),
  );
  progression.forEach((point, index) => {
    if (index % labelStep !== 0 && index !== progression.length - 1) {
      return;
    }
    const x = getX(point.date);
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    label.setAttribute("x", x);
    label.setAttribute("y", height - 30);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "#a89b9b");
    label.setAttribute("font-family", "Impact");
    label.setAttribute("font-size", "11");
    label.textContent = formatDate(point.date).toUpperCase();
    svg.appendChild(label);
  });

  // tooltip for hovering
  const tooltip = document.createElement("div");
  tooltip.style.position = "fixed";
  tooltip.style.display = "none";
  tooltip.style.pointerEvents = "none";
  tooltip.style.zIndex = "1000";
  tooltip.style.background = "#111";
  tooltip.style.border = "1px solid rgba(170, 25, 25, 0.7)";
  tooltip.style.borderRadius = "6px";
  tooltip.style.padding = "12px 16px";
  tooltip.style.color = "#e9dddd";
  tooltip.style.fontFamily = "Impact";
  tooltip.style.fontSize = "14px";
  tooltip.style.boxShadow = "0 0 20px rgba(150, 0, 0, 0.3)";
  tooltip.style.textTransform = "uppercase";
  const tooltipName = document.createElement("div");
  const tooltipType = document.createElement("div");
  const tooltipAmount = document.createElement("div");
  const tooltipTotal = document.createElement("div");
  const tooltipDate = document.createElement("div");
  tooltipName.style.color = "#9b1717";
  tooltipName.style.fontSize = "18px";
  tooltipType.style.color = "#a89b9b";
  tooltipAmount.style.marginTop = "8px";
  tooltipDate.style.marginTop = "6px";
  tooltipDate.style.color = "#a89b9b";
  tooltip.append(
    tooltipName,
    tooltipType,
    tooltipAmount,
    tooltipTotal,
    tooltipDate,
  );
  document.body.appendChild(tooltip);
  // Move tooltip with mouse
  svg.addEventListener("mousemove", (event) => {
    tooltip.style.left = `${event.clientX - 100}px`;
    tooltip.style.top = `${event.clientY - 130}px`;
  });
}
