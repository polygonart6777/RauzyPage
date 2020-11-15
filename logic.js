let labellings = [];
let pathLength = 0;

document.getElementById("inputs").addEventListener("submit", function (event) {
  event.preventDefault();
  document.getElementById("loader").style.display = "block";
  document.getElementById("plot3d").style.display = "none";
  document.getElementById("plot2d").style.display = "none";

  setTimeout(render, 1);
});
function render() {
  labellings[0] = document.getElementById("e1").value;
  labellings[0] = labellings[0].split(",");
  labellings[1] = document.getElementById("e2").value;
  labellings[1] = labellings[1].split(",");
  labellings[2] = document.getElementById("e3").value;
  labellings[2] = labellings[2].split(",");
  labellings[3] = document.getElementById("e4").value;
  labellings[3] = labellings[3].split(",");
  labellings[4] = document.getElementById("e5").value;
  labellings[4] = labellings[4].split(",");

  pathLength = document.getElementById("pathL").value;

  let array = matrixSumBackward(
    relabelPaths(backwardPaths(1, pathLength), labellings)
  );

  const arrayData3d = convertArrayToXYZ(projectionContractingPlane(array));

  const arrayData2d = convertArrayToXY(
    projectionOntoXYPlane(projectionContractingPlane(array))
  );

  let dataset3d = [
    {
      type: "scatter3d",
      x: arrayData3d.xCoords,
      y: arrayData3d.yCoords,
      z: arrayData3d.zCoords,
      mode: "markers",
      marker: {
        size: 2,
        line: { color: "rgba(77, 5, 232, 1)", width: 0.5 },
        opacity: 1,
      },
    },
  ];

  let dataset2d = [
    {
      type: "scatter",
      x: arrayData2d.xCoords,
      y: arrayData2d.yCoords,
      mode: "markers",
      marker: {
        size: 3,
        line: { color: "rgba(77, 5, 232, 1)", width: 0.5 },
        opacity: 1,
      },
    },
  ];

  let range2dMax = Math.max(
    Math.max(arrayData2d.xCoords.map(Math.abs)),
    Math.max(arrayData2d.yCoords.map(Math.abs))
  );

  let layout3d = {
    margin: { l: 0, r: 0, b: 0, t: 0 },
    xaxis: { range: [-1, 1] },
    yaxis: { range: [-1, 1] },
    zaxis: { range: [-1, 1] },
  };

  let layout2d = {
    yaxis: { range: [-1.1 * range2dMax, 1.1 * range2dMax], gridwidth: 2 },
    xaxis: { range: [-1.1 * range2dMax, 1.1 * range2dMax], gridwidth: 1 },
  };

  Plotly.newPlot("plot3d", dataset3d, layout3d).then(spinnerOff);
  Plotly.newPlot("plot2d", dataset2d, layout2d).then(spinnerOff);
}

function forwardPathsV1(pathLength) {
  let paths = [["e1"], ["e2"], ["e3"]];
  while (paths[0].length < pathLength) {
    let paths1 = [];
    let paths2 = [];
    let paths3 = [];
    paths.forEach((path) => {
      lastEdge = path[path.length - 1];
      if (["e1", "e2", "e3"].includes(lastEdge)) {
        const k = path;
        paths1.push(k.concat("e1"), k.concat("e4"));
      } else if (lastEdge == "e4") {
        const l = path;
        paths2.push(l.concat("e2"), l.concat("e5"));
      } else if (lastEdge == "e5") {
        const m = path;
        paths3.push(m.concat("e3"));
      }
    });
    paths = paths1.concat(paths2).concat(paths3);
  }
  return paths;
}

function backwardPaths(vertex, pathLength) {
  let paths = [];
  if (vertex == 1) {
    paths = [["e1"], ["e2"], ["e3"]];
  } else if (vertex == 2) {
    paths = [["e4"]];
  } else {
    paths = [["e5"]];
  }

  while (paths[0].length < pathLength) {
    let paths1 = [];
    let paths2 = [];
    let paths3 = [];
    paths.forEach((path) => {
      lastEdge = path[path.length - 1];
      if (["e1", "e4"].includes(lastEdge)) {
        const k = path;
        paths1.push(k.concat("e1"), k.concat("e2"), k.concat("e3"));
      } else if (["e2", "e5"].includes(lastEdge)) {
        const l = path;
        paths2.push(l.concat("e4"));
      } else if (lastEdge == "e3") {
        const m = path;
        paths3.push(m.concat("e5"));
      }
    });
    paths = paths1.concat(paths2).concat(paths3);
  }
  return paths;
}

function relabelPaths(paths, labels) {
  paths.forEach((path) =>
    path.forEach((edge, index) => {
      if (edge == "e1") {
        path[index] = labels[0];
      } else if (edge == "e2") {
        path[index] = labels[1];
      } else if (edge == "e3") {
        path[index] = labels[2];
      } else if (edge == "e4") {
        path[index] = labels[3];
      } else if (edge == "e5") {
        path[index] = labels[4];
      }
    })
  );
  return paths;
}

function matrixSumBackward(labeledPaths) {
  const b = [
    [1, 1, 1],
    [1, 0, 0],
    [0, 1, 0],
  ];
  const sums = [];
  labeledPaths.forEach((path) => {
    path.forEach((edge, index) => {
      path[index] = math.multiply(math.pow(b, index), edge);
    });
    let sumTotal = path.reduce((edgeA, edgeB) => math.add(edgeA, edgeB), 0);
    sums.push(sumTotal);
  });

  return sums;
}

function projectionContractingPlane(vectors) {
  let M = [
    [0.182804, 0.153425, 0.0993883],
    [-0.182804, -0.153425, 0.900612],
    [-0.681093, 1.07774, 0.321846],
  ];
  let projectedPoints = [];
  vectors.forEach((vector) => {
    let alpha = math.multiply(M, vector)[0];
    let W = math.dotMultiply(alpha, [3.38298, 1.83929, 1]);
    projectedPoints.push(math.subtract(vector, W));
  });

  return projectedPoints;
}

function convertArrayToXYZ(array) {
  xCoords = [];
  yCoords = [];
  zCoords = [];
  array.forEach((tuple) => {
    xCoords.push(tuple[0]);
    yCoords.push(tuple[1]);
    zCoords.push(tuple[2]);
  });

  return { xCoords, yCoords, zCoords };
}

function projectionOntoXYPlane(vectors) {
  vectors2d = [];
  vectors.forEach((vector) => {
    vectors2d.push([
      math.subtract(vector[[0]], math.multiply(vector[[2]], 0.376314)),
      vector[[2]],
    ]);
  });
  return vectors2d;
}

function convertArrayToXY(array) {
  xCoords = [];
  yCoords = [];
  array.forEach((tuple) => {
    xCoords.push(tuple[0]);
    yCoords.push(tuple[1]);
  });
  return { xCoords, yCoords };
}
function spinnerOff() {
  document.getElementById("loader").style.display = "none";
  document.getElementById("plot3d").style.display = "flex";
  document.getElementById("plot2d").style.display = "flex";
}
